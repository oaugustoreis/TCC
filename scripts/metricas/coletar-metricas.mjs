import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * Lista recursivamente todos os arquivos .js de um diretório em ordem determinística.
 */
export function listJsFiles(dirPath, rootDir = ROOT_DIR) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsFiles(fullPath, rootDir));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.relative(rootDir, fullPath).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

/**
 * Conta linhas físicas (linha final sem newline conta 1) e linhas lógicas (SLOC, sem vazias e sem comentários).
 */
export function countLinesAndSloc(content) {
  if (content.length === 0) {
    return { physicalLines: 0, logicalLines: 0 };
  }
  const normalized = content.replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");
  const physicalLines = normalized.endsWith("\n")
    ? rawLines.length - 1
    : rawLines.length;

  const withoutComments = normalized
    .replace(/\/\*[\s\S]*?\*\//g, (match) => "\n".repeat((match.match(/\n/g) || []).length))
    .replace(/\/\/.*$/gm, "");

  const logicalLines = withoutComments
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;

  return { physicalLines, logicalLines };
}

/**
 * Tokenizador léxico determinístico para JavaScript ESM.
 * Remove comentários de linha/bloco e whitespace; preserva literais, operadores e identificadores literalmente (Tipo-1).
 * Cada token guarda { value, line }.
 */
export function tokenizeJs(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  const tokenRegex =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][A-Za-z0-9_$]*\b|===|!==|==|!=|<=|>=|=>|\.\.\.|&&|\|\||[{}()[\].,:;+-/*%=<>!&|^~?])/g;

  const tokens = [];
  let line = 1;
  let lastIndex = 0;

  let match;
  while ((match = tokenRegex.exec(normalized)) !== null) {
    const between = normalized.slice(lastIndex, match.index);
    line += (between.match(/\n/g) || []).length;

    const raw = match[0];
    const tokenLines = (raw.match(/\n/g) || []).length;
    if (!raw.startsWith("//") && !raw.startsWith("/*")) {
      tokens.push({ value: raw, line });
    }
    line += tokenLines;
    lastIndex = tokenRegex.lastIndex;
  }

  return tokens;
}

/**
 * Detector léxico de duplicação de código (clones Tipo-1 por janela mínima de minTokens, padrão 25).
 * - Não cruza fronteira entre arquivos distintos.
 * - Usa união de conjuntos para tokens (Uint8Array) e linhas (Set arquivo:linha), evitando contagem dupla em janelas sobrepostas.
 * - Separa clones intra-arquivo e inter-arquivos.
 */
export function computeCodeDuplication(filesData, minTokens = 25) {
  const allTokens = [];
  const fileTokenRanges = [];

  for (const file of filesData) {
    const startIdx = allTokens.length;
    for (const t of file.tokens) {
      allTokens.push({
        file: file.relPath,
        line: t.line,
        value: t.value,
      });
    }
    fileTokenRanges.push({
      file: file.relPath,
      start: startIdx,
      end: allTokens.length,
    });
  }

  const totalTokens = allTokens.length;
  const rulesDescription =
    "Remove comentários de linha/bloco e whitespace; preserva literais e identificadores literalmente (clones Tipo-1); não cruza fronteira entre arquivos; percentual calculado sobre a união de posições de tokens e de linhas SLOC (sem contagem dupla em regiões sobrepostas).";

  if (totalTokens < minTokens) {
    return {
      algorithm: "exact-token-window-union-v1",
      min_tokens_window: minTokens,
      normalization_rules: rulesDescription,
      total_tokens: totalTokens,
      duplicated_tokens: 0,
      duplication_tokens_pct: 0,
      duplicated_lines: 0,
      duplication_lines_pct: 0,
      clones_count: 0,
      intra_file_clones_count: 0,
      cross_file_clones_count: 0,
    };
  }

  const windowMap = new Map();
  for (const range of fileTokenRanges) {
    const len = range.end - range.start;
    if (len < minTokens) continue;
    for (let i = range.start; i <= range.end - minTokens; i++) {
      const signature = allTokens
        .slice(i, i + minTokens)
        .map((t) => t.value)
        .join(" ");
      let list = windowMap.get(signature);
      if (!list) {
        list = [];
        windowMap.set(signature, list);
      }
      list.push({ pos: i, file: range.file, fileStart: range.start });
    }
  }

  const isTokenDuplicated = new Uint8Array(totalTokens);
  const duplicatedFileLines = new Set();
  let clonesCount = 0;
  let intraFileClonesCount = 0;
  let crossFileClonesCount = 0;

  for (const occurrences of windowMap.values()) {
    if (occurrences.length > 1) {
      const isNewGroup = occurrences.some(
        (occ) => occ.pos === occ.fileStart || isTokenDuplicated[occ.pos - 1] === 0
      );
      if (isNewGroup) {
        clonesCount += 1;
        const distinctFiles = new Set(occurrences.map((o) => o.file));
        if (distinctFiles.size === 1) {
          intraFileClonesCount += 1;
        } else {
          crossFileClonesCount += 1;
        }
      }
      for (const occ of occurrences) {
        for (let k = occ.pos; k < occ.pos + minTokens; k++) {
          isTokenDuplicated[k] = 1;
          duplicatedFileLines.add(`${allTokens[k].file}:${allTokens[k].line}`);
        }
      }
    }
  }

  let duplicatedTokens = 0;
  for (let i = 0; i < totalTokens; i++) {
    if (isTokenDuplicated[i]) duplicatedTokens++;
  }

  const totalLogicalLines = filesData.reduce((acc, f) => acc + f.logicalLines, 0);
  const duplicatedLines = duplicatedFileLines.size;

  return {
    algorithm: "exact-token-window-union-v1",
    min_tokens_window: minTokens,
    normalization_rules: rulesDescription,
    total_tokens: totalTokens,
    duplicated_tokens: duplicatedTokens,
    duplication_tokens_pct:
      totalTokens > 0 ? Number(((duplicatedTokens / totalTokens) * 100).toFixed(2)) : 0,
    duplicated_lines: duplicatedLines,
    duplication_lines_pct:
      totalLogicalLines > 0
        ? Number(((duplicatedLines / totalLogicalLines) * 100).toFixed(2))
        : 0,
    clones_count: clonesCount,
    intra_file_clones_count: intraFileClonesCount,
    cross_file_clones_count: crossFileClonesCount,
  };
}

/**
 * Extrai imports ESM de um arquivo JS e resolve seus caminhos relativos à raiz do projeto.
 */
export function extractImports(relFilePath, content) {
  const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  const dir = path.posix.dirname(relFilePath);
  const imports = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const spec = match[1];
    if (spec.startsWith(".")) {
      const resolved = path.posix.normalize(path.posix.join(dir, spec));
      imports.push({ specifier: spec, resolved, type: "relative" });
    } else {
      imports.push({ specifier: spec, resolved: spec, type: "external" });
    }
  }
  return imports;
}

/**
 * Calcula a reutilização específica do lote (batch_reuse) a partir SOMENTE dos arquivos criados (A)
 * ou modificados (M) na etapa, percorrendo o fecho transitivo de dependências internas.
 * Isso evita inflar a reutilização com módulos antigos que não participaram da tarefa.
 */
export function computeBatchReuse(suiteName, filesMap, baseDiffStatusMap) {
  if (!baseDiffStatusMap) {
    return null;
  }

  const touchedFiles = [];
  for (const [filePath, status] of baseDiffStatusMap.entries()) {
    if (filePath.startsWith(`${suiteName}/`) && (status === "A" || status === "M")) {
      if (filesMap.has(filePath)) {
        touchedFiles.push(filePath);
      }
    }
  }
  touchedFiles.sort();

  // Fecho transitivo de arquivos participantes do lote e arestas de consumo no lote
  const visitedActiveFiles = new Set(touchedFiles);
  const queue = [...touchedFiles];
  const batchComponentConsumers = new Map();

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const fileObj = filesMap.get(currentPath);
    if (!fileObj) continue;

    for (const imp of fileObj.imports) {
      if (imp.type === "relative" && imp.resolved.startsWith(`${suiteName}/`)) {
        let consumers = batchComponentConsumers.get(imp.resolved);
        if (!consumers) {
          consumers = new Set();
          batchComponentConsumers.set(imp.resolved, consumers);
        }
        consumers.add(currentPath);

        if (!visitedActiveFiles.has(imp.resolved) && filesMap.has(imp.resolved)) {
          visitedActiveFiles.add(imp.resolved);
          queue.push(imp.resolved);
        }
      }
    }
  }

  const batchComponents = [];
  for (const [compPath, consumersSet] of [...batchComponentConsumers.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const gitStatus = baseDiffStatusMap.get(compPath);
    let classification = "reused_unmodified";
    if (gitStatus === "A") {
      classification = "created_in_batch";
    } else if (gitStatus === "M") {
      classification = "reused_modified";
    }
    batchComponents.push({
      component: compPath,
      classification,
      git_status_in_batch: gitStatus || "UNMODIFIED",
      batch_consumers_count: consumersSet.size,
      batch_consumers: [...consumersSet].sort(),
    });
  }

  return {
    batch_entry_files_touched: touchedFiles,
    batch_active_files_total: visitedActiveFiles.size,
    batch_distinct_components_imported: batchComponents.length,
    batch_reused_unmodified_count: batchComponents.filter(
      (c) => c.classification === "reused_unmodified"
    ).length,
    batch_reused_modified_count: batchComponents.filter(
      (c) => c.classification === "reused_modified"
    ).length,
    batch_created_shared_count: batchComponents.filter(
      (c) => c.classification === "created_in_batch"
    ).length,
    components: batchComponents,
  };
}

/**
 * Analisa uma suíte (tradicional ou modular) em disco, separando acoplamento estático global
 * da reutilização específica do lote (batch_reuse).
 */
export function analyzeSuiteStructure(suiteName, rootDir = ROOT_DIR, baseDiffStatusMap = null) {
  const suiteDir = path.join(rootDir, suiteName);
  const relFiles = listJsFiles(suiteDir, rootDir);

  const filesData = [];
  const filesMap = new Map();
  const layerCounts = {};
  const staticComponentConsumers = new Map();
  let sharedConfigImportsCount = 0;
  let internalImportsCount = 0;

  for (const relPath of relFiles) {
    const absPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    const bytes = Buffer.byteLength(content, "utf8");
    const { physicalLines, logicalLines } = countLinesAndSloc(content);
    const tokens = tokenizeJs(content);
    const imports = extractImports(relPath, content);

    const parts = relPath.split("/");
    const layer = parts.length > 2 ? parts[1] : "root";
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;

    for (const imp of imports) {
      if (imp.type === "relative") {
        if (imp.resolved.startsWith("shared/")) {
          sharedConfigImportsCount += 1;
        } else if (imp.resolved.startsWith(`${suiteName}/`)) {
          internalImportsCount += 1;
          let consumers = staticComponentConsumers.get(imp.resolved);
          if (!consumers) {
            consumers = new Set();
            staticComponentConsumers.set(imp.resolved, consumers);
          }
          consumers.add(relPath);
        }
      }
    }

    const fileObj = {
      relPath,
      layer,
      bytes,
      physicalLines,
      logicalLines,
      tokens,
      imports,
    };
    filesData.push(fileObj);
    filesMap.set(relPath, fileObj);
  }

  const duplication = computeCodeDuplication(filesData, 25);
  const batchReuse = computeBatchReuse(suiteName, filesMap, baseDiffStatusMap);

  const staticComponents = [];
  for (const [compPath, consumersSet] of [...staticComponentConsumers.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    staticComponents.push({
      component: compPath,
      consumers_count: consumersSet.size,
      consumers: [...consumersSet].sort(),
    });
  }

  return {
    suite: suiteName,
    files_count: filesData.length,
    layers: layerCounts,
    physical_lines: filesData.reduce((acc, f) => acc + f.physicalLines, 0),
    logical_lines: filesData.reduce((acc, f) => acc + f.logicalLines, 0),
    bytes: filesData.reduce((acc, f) => acc + f.bytes, 0),
    static_suite_imports: {
      internal_imports_total: internalImportsCount,
      shared_config_imports_total: sharedConfigImportsCount,
      distinct_internal_components_imported: staticComponents.length,
      components: staticComponents,
    },
    batch_reuse: batchReuse,
    duplication,
    files: filesData.map((f) => ({
      path: f.relPath,
      layer: f.layer,
      physical_lines: f.physicalLines,
      logical_lines: f.logicalLines,
      tokens_count: f.tokens.length,
      bytes: f.bytes,
    })),
  };
}

/**
 * Coleta deltas líquidos do Git (--numstat e --name-status) entre baseRef e targetRef,
 * diferenciando mudança líquida (net_diff_lines) de retrabalho intermediário (intermediate_churn).
 */
export function collectGitDelta(
  scopePath,
  baseRef,
  targetRef = "HEAD",
  rootDir = ROOT_DIR,
  checkpointRefs = []
) {
  if (!baseRef) {
    return null;
  }
  const runNumstat = (fromRef, toRef) => {
    const diffRange = toRef === "WORKTREE" ? [fromRef] : [fromRef, toRef];
    return execFileSync(
      "git",
      [
        "-c",
        `safe.directory=${rootDir}`,
        "diff",
        "--no-ext-diff",
        "--no-textconv",
        "--no-renames",
        "--numstat",
        ...diffRange,
        "--",
        scopePath,
      ],
      { cwd: rootDir, encoding: "utf8" }
    ).trim();
  };

  const numstatOut = runNumstat(baseRef, targetRef);
  const diffRange = targetRef === "WORKTREE" ? [baseRef] : [baseRef, targetRef];
  const nameStatusOut = execFileSync(
    "git",
    [
      "-c",
      `safe.directory=${rootDir}`,
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--no-renames",
      "--name-status",
      ...diffRange,
      "--",
      scopePath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  ).trim();

  let linesAdded = 0;
  let linesRemoved = 0;
  const perFileNumstat = [];

  if (numstatOut) {
    for (const line of numstatOut.split(/\r?\n/)) {
      const [addStr, remStr, filePath] = line.split("\t");
      const added = addStr === "-" ? 0 : Number(addStr);
      const removed = remStr === "-" ? 0 : Number(remStr);
      linesAdded += added;
      linesRemoved += removed;
      perFileNumstat.push({ path: filePath, added, removed });
    }
  }

  const statusMap = new Map();
  let filesAdded = 0;
  let filesModified = 0;
  let filesDeleted = 0;

  if (nameStatusOut) {
    for (const line of nameStatusOut.split(/\r?\n/)) {
      const [status, filePath] = line.split("\t");
      statusMap.set(filePath, status);
      if (status === "A") filesAdded++;
      else if (status === "M") filesModified++;
      else if (status === "D") filesDeleted++;
    }
  }

  let intermediateChurn = null;
  let intermediateChurnNote =
    "Sem checkpoints intermediários registrados; net_diff_lines mede apenas a diferença líquida entre SHA-base e SHA-final.";

  if (Array.isArray(checkpointRefs) && checkpointRefs.length > 0) {
    const chain = [baseRef, ...checkpointRefs, targetRef];
    let accum = 0;
    for (let i = 0; i < chain.length - 1; i++) {
      const stepOut = runNumstat(chain[i], chain[i + 1]);
      if (stepOut) {
        for (const line of stepOut.split(/\r?\n/)) {
          const [addStr, remStr] = line.split("\t");
          accum += (addStr === "-" ? 0 : Number(addStr)) + (remStr === "-" ? 0 : Number(remStr));
        }
      }
    }
    intermediateChurn = accum;
    intermediateChurnNote = `Calculado sobre ${checkpointRefs.length} checkpoint(s) intermediário(s).`;
  }

  return {
    base_ref: baseRef,
    target_ref: targetRef,
    lines_added: linesAdded,
    lines_removed: linesRemoved,
    net_lines_delta: linesAdded - linesRemoved,
    net_diff_lines: linesAdded + linesRemoved,
    intermediate_churn: intermediateChurn,
    intermediate_churn_note: intermediateChurnNote,
    files_added: filesAdded,
    files_modified: filesModified,
    files_deleted: filesDeleted,
    files_touched_total: filesAdded + filesModified + filesDeleted,
    files_detail: perFileNumstat.map((item) => ({
      ...item,
      status: statusMap.get(item.path) || "M",
    })),
    statusMap,
  };
}

/**
 * Extrai mecanicamente as métricas operacionais do subagente a partir do arquivo transcript.jsonl
 * gravado pelo runtime do sistema (fora do controle do LLM).
 */
export function parseSubagentTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return {
      available: false,
      source_transcript: transcriptPath || null,
      missing_reason: "Arquivo transcript.jsonl do subagente não informado ou não encontrado.",
      first_step_at: null,
      last_step_at: null,
      duration_seconds: null,
      files_read: null,
      files_written: null,
      commands_run: null,
      tool_calls_total: null,
      tool_calls_by_name: null,
    };
  }

  const lines = fs
    .readFileSync(transcriptPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let firstTimestampMs = null;
  let lastTimestampMs = null;
  let firstStepIso = null;
  let lastStepIso = null;
  let filesRead = 0;
  let filesWritten = 0;
  let commandsRun = 0;
  let toolCallsTotal = 0;
  const toolCallsByName = {};

  for (const line of lines) {
    const step = JSON.parse(line);
    if (step.created_at) {
      const ms = Date.parse(step.created_at);
      if (!Number.isNaN(ms)) {
        if (firstTimestampMs === null || ms < firstTimestampMs) {
          firstTimestampMs = ms;
          firstStepIso = step.created_at;
        }
        if (lastTimestampMs === null || ms > lastTimestampMs) {
          lastTimestampMs = ms;
          lastStepIso = step.created_at;
        }
      }
    }

    if (Array.isArray(step.tool_calls)) {
      for (const tc of step.tool_calls) {
        const name = tc.name || tc.tool_name || "unknown";
        toolCallsTotal += 1;
        toolCallsByName[name] = (toolCallsByName[name] || 0) + 1;
        if (name === "read_file" || name === "view_file") {
          filesRead += 1;
        } else if (name === "write_file" || name === "edit_file") {
          filesWritten += 1;
        } else if (name === "run_command") {
          commandsRun += 1;
        }
      }
    }
  }

  const durationSeconds =
    firstTimestampMs !== null && lastTimestampMs !== null
      ? Number(((lastTimestampMs - firstTimestampMs) / 1000).toFixed(2))
      : null;

  return {
    available: true,
    source_transcript: transcriptPath,
    missing_reason: null,
    first_step_at: firstStepIso,
    last_step_at: lastStepIso,
    duration_seconds: durationSeconds,
    files_read: filesRead,
    files_written: filesWritten,
    commands_run: commandsRun,
    tool_calls_total: toolCallsTotal,
    tool_calls_by_name: toolCallsByName,
  };
}

/**
 * Lê o histórico real de execuções do validador (uma pasta com subpastas de tentativas ou uma lista de result.json),
 * separando falhas de infraestrutura de ciclos funcionais e determinando first_validation_pass.
 */
export function parseValidationAttempts(attemptsInput) {
  if (!attemptsInput) {
    return {
      available: false,
      missing_reason: "Caminho de tentativas de validação não informado.",
      first_validation_pass: null,
      functional_validation_cycles: null,
      infra_error_runs: null,
      final_validation_passed: null,
      attempts: [],
    };
  }

  let resultFiles = [];
  if (Array.isArray(attemptsInput)) {
    resultFiles = attemptsInput.filter((p) => fs.existsSync(p));
  } else if (fs.existsSync(attemptsInput)) {
    const stat = fs.statSync(attemptsInput);
    if (stat.isFile()) {
      resultFiles = [attemptsInput];
    } else if (stat.isDirectory()) {
      const directResult = path.join(attemptsInput, "result.json");
      if (fs.existsSync(directResult)) {
        resultFiles = [directResult];
      } else {
        const subdirs = fs
          .readdirSync(attemptsInput, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort();
        for (const sub of subdirs) {
          const candidate = path.join(attemptsInput, sub, "result.json");
          if (fs.existsSync(candidate)) {
            resultFiles.push(candidate);
          }
        }
      }
    }
  }

  if (resultFiles.length === 0) {
    return {
      available: false,
      missing_reason: "Nenhum arquivo result.json encontrado para a unidade.",
      first_validation_pass: null,
      functional_validation_cycles: null,
      infra_error_runs: null,
      final_validation_passed: null,
      attempts: [],
    };
  }

  const attempts = [];
  let functionalCycles = 0;
  let infraErrors = 0;
  let firstFunctionalPass = null;
  let finalFunctionalPass = null;

  for (const filePath of resultFiles) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const isInfraError = Boolean(
      raw.infra_error ||
        (Array.isArray(raw.runs) &&
          raw.runs.some((r) => r.api_ready === false || r.k6_spawn_error === true))
    );
    const passed = Boolean(raw.validation_passed);

    if (isInfraError) {
      infraErrors += 1;
    } else {
      functionalCycles += 1;
      if (firstFunctionalPass === null) {
        firstFunctionalPass = passed;
      }
      finalFunctionalPass = passed;
    }

    attempts.push({
      result_file: filePath,
      is_infra_error: isInfraError,
      validation_passed: passed,
    });
  }

  return {
    available: true,
    missing_reason: null,
    first_validation_pass: firstFunctionalPass,
    functional_validation_cycles: functionalCycles,
    infra_error_runs: infraErrors,
    final_validation_passed: finalFunctionalPass,
    attempts,
  };
}

/**
 * Constrói o registro auditável de esforço operacional do agente para uma condição
 * a partir dos logs primários (transcript.jsonl e result.json das tentativas de validação).
 */
export function buildAuditedAgentUnitMetrics({ transcriptPath = null, validationAttempts = null } = {}) {
  const transcript = parseSubagentTranscript(transcriptPath);
  const validation = parseValidationAttempts(validationAttempts);

  return {
    transcript,
    validation,
    summary: {
      first_validation_pass: validation.first_validation_pass,
      functional_validation_cycles: validation.functional_validation_cycles,
      infra_error_runs: validation.infra_error_runs,
      files_read: transcript.files_read,
      files_written: transcript.files_written,
      commands_run: transcript.commands_run,
      tool_calls_total: transcript.tool_calls_total,
      duration_seconds: transcript.duration_seconds,
    },
  };
}

/**
 * Gera relatório comparativo completo entre Tradicional e Modular.
 */
export function collectStageMetrics({
  stateId = "E0",
  baseRef = null,
  targetRef = "HEAD",
  validationResultPath = null,
  agentMetricsPath = null,
  tradTranscriptPath = null,
  modTranscriptPath = null,
  tradValidationAttempts = null,
  modValidationAttempts = null,
  rootDir = ROOT_DIR,
} = {}) {
  const tradGit = collectGitDelta("tradicional/", baseRef, targetRef, rootDir);
  const modGit = collectGitDelta("modular/", baseRef, targetRef, rootDir);

  const tradicional = analyzeSuiteStructure(
    "tradicional",
    rootDir,
    tradGit ? tradGit.statusMap : null
  );
  const modular = analyzeSuiteStructure(
    "modular",
    rootDir,
    modGit ? modGit.statusMap : null
  );

  let validationSummary = null;
  if (validationResultPath && fs.existsSync(validationResultPath)) {
    const rawVal = JSON.parse(fs.readFileSync(validationResultPath, "utf8"));
    validationSummary = {
      path: path.relative(rootDir, validationResultPath).split(path.sep).join("/"),
      state: rawVal.state || stateId,
      validation_passed: Boolean(rawVal.validation_passed),
      complete_functional_equivalence: Boolean(rawVal.complete_functional_equivalence),
      runs_total: Array.isArray(rawVal.runs) ? rawVal.runs.length : null,
    };
  }

  let tradAgent = null;
  let modAgent = null;

  if (tradTranscriptPath || tradValidationAttempts || modTranscriptPath || modValidationAttempts) {
    tradAgent = buildAuditedAgentUnitMetrics({
      transcriptPath: tradTranscriptPath,
      validationAttempts: tradValidationAttempts,
    });
    modAgent = buildAuditedAgentUnitMetrics({
      transcriptPath: modTranscriptPath,
      validationAttempts: modValidationAttempts,
    });
  } else if (agentMetricsPath && fs.existsSync(agentMetricsPath)) {
    const rawAgent = JSON.parse(fs.readFileSync(agentMetricsPath, "utf8"));
    tradAgent = rawAgent.tradicional || null;
    modAgent = rawAgent.modular || null;
  }

  const cleanGit = (g) => {
    if (!g) return null;
    const { statusMap, ...rest } = g;
    return rest;
  };

  return {
    generated_at: new Date().toISOString(),
    state: stateId,
    tradicional: {
      ...tradicional,
      git_delta: cleanGit(tradGit),
      agent: tradAgent,
    },
    modular: {
      ...modular,
      git_delta: cleanGit(modGit),
      agent: modAgent,
    },
    paired_comparison: {
      files_diff_mod_minus_trad: modular.files_count - tradicional.files_count,
      physical_lines_diff_mod_minus_trad:
        modular.physical_lines - tradicional.physical_lines,
      logical_lines_diff_mod_minus_trad:
        modular.logical_lines - tradicional.logical_lines,
      duplication_tokens_pct_diff_mod_minus_trad: Number(
        (
          modular.duplication.duplication_tokens_pct -
          tradicional.duplication.duplication_tokens_pct
        ).toFixed(2)
      ),
      duplication_lines_pct_diff_mod_minus_trad: Number(
        (
          modular.duplication.duplication_lines_pct -
          tradicional.duplication.duplication_lines_pct
        ).toFixed(2)
      ),
      git_delta_comparison:
        tradGit && modGit
          ? {
              lines_added_diff_mod_minus_trad:
                modGit.lines_added - tradGit.lines_added,
              net_diff_lines_mod_minus_trad:
                modGit.net_diff_lines - tradGit.net_diff_lines,
              files_touched_diff_mod_minus_trad:
                modGit.files_touched_total - tradGit.files_touched_total,
              files_modified_diff_mod_minus_trad:
                modGit.files_modified - tradGit.files_modified,
            }
          : null,
    },
    validation: validationSummary,
  };
}

export function formatMarkdownSummary(report) {
  const t = report.tradicional;
  const m = report.modular;
  const lines = [
    `# Relatório de Métricas — Estado ${report.state}`,
    ``,
    `Gerado em: \`${report.generated_at}\``,
    ``,
    `## 1. Métricas Estruturais, Acoplamento Estático e Duplicação`,
    ``,
    `| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |`,
    `|---|---:|---:|---:|`,
    `| Arquivos JS autorais | ${t.files_count} | ${m.files_count} | ${m.files_count - t.files_count} |`,
    `| Linhas físicas (LOC) | ${t.physical_lines} | ${m.physical_lines} | ${m.physical_lines - t.physical_lines} |`,
    `| Linhas lógicas (SLOC) | ${t.logical_lines} | ${m.logical_lines} | ${m.logical_lines - t.logical_lines} |`,
    `| Total de tokens JS | ${t.duplication.total_tokens} | ${m.duplication.total_tokens} | ${m.duplication.total_tokens - t.duplication.total_tokens} |`,
    `| Clones detectados (>=25 tokens) | ${t.duplication.clones_count} | ${m.duplication.clones_count} | ${m.duplication.clones_count - t.duplication.clones_count} |`,
    `| Tokens duplicados (%) | ${t.duplication.duplication_tokens_pct}% | ${m.duplication.duplication_tokens_pct}% | ${report.paired_comparison.duplication_tokens_pct_diff_mod_minus_trad}% |`,
    `| Linhas duplicadas (%) | ${t.duplication.duplication_lines_pct}% | ${m.duplication.duplication_lines_pct}% | ${report.paired_comparison.duplication_lines_pct_diff_mod_minus_trad}% |`,
    `| Imports internos estáticos (acumulado) | ${t.static_suite_imports.internal_imports_total} | ${m.static_suite_imports.internal_imports_total} | ${m.static_suite_imports.internal_imports_total - t.static_suite_imports.internal_imports_total} |`,
    `| Módulos internos referenciados (acumulado) | ${t.static_suite_imports.distinct_internal_components_imported} | ${m.static_suite_imports.distinct_internal_components_imported} | ${m.static_suite_imports.distinct_internal_components_imported - t.static_suite_imports.distinct_internal_components_imported} |`,
  ];

  if (t.git_delta && m.git_delta) {
    lines.push(
      ``,
      `## 2. Delta Git e Reutilização da Tarefa (${t.git_delta.base_ref} -> ${t.git_delta.target_ref})`,
      ``,
      `| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |`,
      `|---|---:|---:|---:|`,
      `| Arquivos criados (A) | ${t.git_delta.files_added} | ${m.git_delta.files_added} | ${m.git_delta.files_added - t.git_delta.files_added} |`,
      `| Arquivos modificados (M) | ${t.git_delta.files_modified} | ${m.git_delta.files_modified} | ${m.git_delta.files_modified - t.git_delta.files_modified} |`,
      `| Total de arquivos tocados (Blast Radius) | ${t.git_delta.files_touched_total} | ${m.git_delta.files_touched_total} | ${m.git_delta.files_touched_total - t.git_delta.files_touched_total} |`,
      `| Linhas adicionadas (+) | ${t.git_delta.lines_added} | ${m.git_delta.lines_added} | ${m.git_delta.lines_added - t.git_delta.lines_added} |`,
      `| Linhas removidas (-) | ${t.git_delta.lines_removed} | ${m.git_delta.lines_removed} | ${m.git_delta.lines_removed - t.git_delta.lines_removed} |`,
      `| Volume de alteração líquida (net_diff_lines) | ${t.git_delta.net_diff_lines} | ${m.git_delta.net_diff_lines} | ${m.git_delta.net_diff_lines - t.git_delta.net_diff_lines} |`,
      `| Churn intermediário (checkpoints) | ${t.git_delta.intermediate_churn ?? "N/A"} | ${m.git_delta.intermediate_churn ?? "N/A"} | — |`,
      `| Componentes preexistentes reutilizados sem edição no lote | ${t.batch_reuse ? t.batch_reuse.batch_reused_unmodified_count : 0} | ${m.batch_reuse ? m.batch_reuse.batch_reused_unmodified_count : 0} | ${(m.batch_reuse ? m.batch_reuse.batch_reused_unmodified_count : 0) - (t.batch_reuse ? t.batch_reuse.batch_reused_unmodified_count : 0)} |`,
      `| Componentes preexistentes adaptados (M) no lote | ${t.batch_reuse ? t.batch_reuse.batch_reused_modified_count : 0} | ${m.batch_reuse ? m.batch_reuse.batch_reused_modified_count : 0} | ${(m.batch_reuse ? m.batch_reuse.batch_reused_modified_count : 0) - (t.batch_reuse ? t.batch_reuse.batch_reused_modified_count : 0)} |`,
      `| Novos componentes compartilhados criados (A) no lote | ${t.batch_reuse ? t.batch_reuse.batch_created_shared_count : 0} | ${m.batch_reuse ? m.batch_reuse.batch_created_shared_count : 0} | ${(m.batch_reuse ? m.batch_reuse.batch_created_shared_count : 0) - (t.batch_reuse ? t.batch_reuse.batch_created_shared_count : 0)} |`
    );
  }

  const tSum = t.agent?.summary || t.agent;
  const mSum = m.agent?.summary || m.agent;
  if (tSum && mSum) {
    const fmtPass = (val) => (val === true ? "Sim" : val === false ? "Não" : "Indisponível");
    const fmtNum = (val) => (val !== null && val !== undefined ? val : "Indisponível");
    const fmtDiff = (a, b) =>
      typeof a === "number" && typeof b === "number" ? a - b : "—";

    lines.push(
      ``,
      `## 3. Esforço Operacional Auditado do Agente de IA`,
      ``,
      `| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |`,
      `|---|---:|---:|---:|`,
      `| Aprovação na 1ª validação (first_validation_pass) | ${fmtPass(tSum.first_validation_pass)} | ${fmtPass(mSum.first_validation_pass)} | — |`,
      `| Ciclos funcionais de validação | ${fmtNum(tSum.functional_validation_cycles)} | ${fmtNum(mSum.functional_validation_cycles)} | ${fmtDiff(mSum.functional_validation_cycles, tSum.functional_validation_cycles)} |`,
      `| Execuções com erro de infraestrutura | ${fmtNum(tSum.infra_error_runs)} | ${fmtNum(mSum.infra_error_runs)} | ${fmtDiff(mSum.infra_error_runs, tSum.infra_error_runs)} |`,
      `| Leituras de arquivos (files_read) | ${fmtNum(tSum.files_read)} | ${fmtNum(mSum.files_read)} | ${fmtDiff(mSum.files_read, tSum.files_read)} |`,
      `| Operações de escrita/edição (files_written) | ${fmtNum(tSum.files_written)} | ${fmtNum(mSum.files_written)} | ${fmtDiff(mSum.files_written, tSum.files_written)} |`,
      `| Comandos executados (commands_run) | ${fmtNum(tSum.commands_run)} | ${fmtNum(mSum.commands_run)} | ${fmtDiff(mSum.commands_run, tSum.commands_run)} |`,
      `| Total de Tool Calls | ${fmtNum(tSum.tool_calls_total)} | ${fmtNum(mSum.tool_calls_total)} | ${fmtDiff(mSum.tool_calls_total, tSum.tool_calls_total)} |`,
      `| Duração registrada do subagente (s) | ${fmtNum(tSum.duration_seconds)} | ${fmtNum(mSum.duration_seconds)} | ${typeof mSum.duration_seconds === "number" && typeof tSum.duration_seconds === "number" ? Number((mSum.duration_seconds - tSum.duration_seconds).toFixed(2)) : "—"} |`
    );
  }

  return [
    ...lines,
    ``,
    `## Glossário das Métricas (Para Referência no TCC)`,
    ``,
    `- **Arquivos JS autorais**: Quantidade total de arquivos \`.js\` que compõem a suíte (\`tradicional/\` vs. \`modular/\`, incluindo todas as camadas e helpers).`,
    `- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).`,
    `- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).`,
    `- **Reutilização da Tarefa (\`batch_reuse\`) vs. Acoplamento Estático (\`static_suite_imports\`)**: Em cada etapa, \`batch_reuse\` parte exclusivamente dos arquivos criados (\`A\`) ou modificados (\`M\`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (\`reused_unmodified\`) ou com adaptação (\`reused_modified\`), evitando inflar a contagem com módulos antigos não utilizados no lote.`,
    `- **Volume de alteração líquida (\`net_diff_lines\`) vs. Operações de escrita (\`files_written\`)**: \`net_diff_lines\` mede a soma líquida \`lines_added + lines_removed\` no \`git diff\` final da etapa, enquanto \`files_written\` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.`,
    `- **Aprovação na 1ª validação (\`first_validation_pass\`)**: Indicador operacional que registra se a primeira execução funcional de \`scripts/validacao/validar.mjs\` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em \`infra_error_runs\`).`,
  ].join("\n") + "\n";
}

function parseCliArgs(argv) {
  const args = {
    state: "E0",
    base: null,
    target: "HEAD",
    validation: null,
    agentMetrics: null,
    tradTranscript: null,
    modTranscript: null,
    tradValAttempts: null,
    modValAttempts: null,
    outDir: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--state") args.state = argv[++i];
    else if (arg === "--base") args.base = argv[++i];
    else if (arg === "--target") args.target = argv[++i];
    else if (arg === "--validation") args.validation = argv[++i];
    else if (arg === "--agent-metrics") args.agentMetrics = argv[++i];
    else if (arg === "--trad-transcript") args.tradTranscript = argv[++i];
    else if (arg === "--mod-transcript") args.modTranscript = argv[++i];
    else if (arg === "--trad-val-attempts") args.tradValAttempts = argv[++i];
    else if (arg === "--mod-val-attempts") args.modValAttempts = argv[++i];
    else if (arg === "--out") args.outDir = argv[++i];
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const cli = parseCliArgs(process.argv);
  const report = collectStageMetrics({
    stateId: cli.state,
    baseRef: cli.base,
    targetRef: cli.target,
    validationResultPath: cli.validation ? path.resolve(ROOT_DIR, cli.validation) : null,
    agentMetricsPath: cli.agentMetrics ? path.resolve(ROOT_DIR, cli.agentMetrics) : null,
    tradTranscriptPath: cli.tradTranscript ? path.resolve(ROOT_DIR, cli.tradTranscript) : null,
    modTranscriptPath: cli.modTranscript ? path.resolve(ROOT_DIR, cli.modTranscript) : null,
    tradValidationAttempts: cli.tradValAttempts
      ? path.resolve(ROOT_DIR, cli.tradValAttempts)
      : null,
    modValidationAttempts: cli.modValAttempts
      ? path.resolve(ROOT_DIR, cli.modValAttempts)
      : null,
  });

  const md = formatMarkdownSummary(report);
  if (cli.outDir) {
    const outPath = path.resolve(ROOT_DIR, cli.outDir);
    fs.mkdirSync(outPath, { recursive: true });
    fs.writeFileSync(path.join(outPath, "metricas.json"), JSON.stringify(report, null, 2), "utf8");
    fs.writeFileSync(path.join(outPath, "RELATORIO_METRICAS.md"), md, "utf8");
    console.log(`Métricas salvas em: ${outPath}`);
  } else {
    console.log(md);
  }
}
