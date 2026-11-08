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
 * Conta linhas físicas (conforme regra do plano: linha final sem newline conta 1) e linhas lógicas (SLOC).
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

  // Remover comentários de bloco e de linha para SLOC
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
 * Tokenizador léxico leve para JavaScript ESM (para cálculo determinístico de clones de código).
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
 * Calcula duplicação de código (clones baseados em janelas de tokens >= minTokens, padrão 25 tokens,
 * equivalente ao corte clássico de ferramentas como jscpd).
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
  if (totalTokens < minTokens) {
    return {
      min_tokens_window: minTokens,
      total_tokens: totalTokens,
      duplicated_tokens: 0,
      duplication_tokens_pct: 0,
      duplicated_lines: 0,
      duplication_lines_pct: 0,
      clones_count: 0,
    };
  }

  // Mapa de hash de janela de minTokens dentro do mesmo arquivo não cruza fronteira de arquivo
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
      list.push(i);
    }
  }

  const isTokenDuplicated = new Uint8Array(totalTokens);
  const duplicatedFileLines = new Set();
  let clonesCount = 0;

  for (const positions of windowMap.values()) {
    if (positions.length > 1) {
      // Conta como grupo de clone quando inicia uma sequência duplicada
      const isNewGroup = positions.some((pos) => pos === 0 || isTokenDuplicated[pos - 1] === 0);
      if (isNewGroup) {
        clonesCount += 1;
      }
      for (const pos of positions) {
        for (let k = pos; k < pos + minTokens; k++) {
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
    min_tokens_window: minTokens,
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
 * Analisa uma suíte (tradicional ou modular) em disco.
 */
export function analyzeSuiteStructure(suiteName, rootDir = ROOT_DIR, baseDiffStatusMap = null) {
  const suiteDir = path.join(rootDir, suiteName);
  const relFiles = listJsFiles(suiteDir, rootDir);

  const filesData = [];
  const layerCounts = {};
  const componentConsumers = new Map();
  let sharedConfigImportsCount = 0;
  let internalImportsCount = 0;

  for (const relPath of relFiles) {
    const absPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(absPath, "utf8");
    const bytes = Buffer.byteLength(content, "utf8");
    const { physicalLines, logicalLines } = countLinesAndSloc(content);
    const tokens = tokenizeJs(content);
    const imports = extractImports(relPath, content);

    // Determinar camada (ex.: scenarios, profiles, flows, use-cases, helpers, ou root)
    const parts = relPath.split("/");
    const layer = parts.length > 2 ? parts[1] : "root";
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;

    for (const imp of imports) {
      if (imp.type === "relative") {
        if (imp.resolved.startsWith("shared/")) {
          sharedConfigImportsCount += 1;
        } else if (imp.resolved.startsWith(`${suiteName}/`)) {
          internalImportsCount += 1;
          let consumers = componentConsumers.get(imp.resolved);
          if (!consumers) {
            consumers = new Set();
            componentConsumers.set(imp.resolved, consumers);
          }
          consumers.add(relPath);
        }
      }
    }

    filesData.push({
      relPath,
      layer,
      bytes,
      physicalLines,
      logicalLines,
      tokens,
      imports,
    });
  }

  const duplication = computeCodeDuplication(filesData, 25);

  const reusedComponents = [];
  for (const [compPath, consumersSet] of [...componentConsumers.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const consumers = [...consumersSet].sort();
    let statusInBatch = "preexisting_unmodified";
    if (baseDiffStatusMap) {
      const gitStatus = baseDiffStatusMap.get(compPath);
      if (gitStatus === "A") statusInBatch = "created_in_batch";
      else if (gitStatus === "M") statusInBatch = "reused_with_adaptation";
    }
    reusedComponents.push({
      component: compPath,
      consumers_count: consumers.length,
      consumers,
      status_in_batch: statusInBatch,
    });
  }

  return {
    suite: suiteName,
    files_count: filesData.length,
    layers: layerCounts,
    physical_lines: filesData.reduce((acc, f) => acc + f.physicalLines, 0),
    logical_lines: filesData.reduce((acc, f) => acc + f.logicalLines, 0),
    bytes: filesData.reduce((acc, f) => acc + f.bytes, 0),
    reuse: {
      internal_imports_total: internalImportsCount,
      shared_config_imports_total: sharedConfigImportsCount,
      distinct_internal_components_imported: reusedComponents.length,
      components_reused_unmodified: reusedComponents.filter(
        (c) => c.status_in_batch === "preexisting_unmodified"
      ).length,
      components_reused_with_adaptation: reusedComponents.filter(
        (c) => c.status_in_batch === "reused_with_adaptation"
      ).length,
      components_created_in_batch: reusedComponents.filter(
        (c) => c.status_in_batch === "created_in_batch"
      ).length,
      components: reusedComponents,
    },
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
 * Coleta deltas Git (--numstat e --name-status) para um escopo (ex.: tradicional/ ou modular/).
 */
export function collectGitDelta(scopePath, baseRef, targetRef = "HEAD", rootDir = ROOT_DIR) {
  if (!baseRef) {
    return null;
  }
  const diffRange = targetRef === "WORKTREE" ? [baseRef] : [baseRef, targetRef];
  const numstatOut = execFileSync(
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

  return {
    base_ref: baseRef,
    target_ref: targetRef,
    lines_added: linesAdded,
    lines_removed: linesRemoved,
    net_lines_delta: linesAdded - linesRemoved,
    total_lines_churn: linesAdded + linesRemoved,
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
 * Gera relatório comparativo completo entre Tradicional e Modular.
 */
export function collectStageMetrics({
  stateId = "E0",
  baseRef = null,
  targetRef = "HEAD",
  validationResultPath = null,
  agentMetricsPath = null,
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

  let agentMetrics = null;
  if (agentMetricsPath && fs.existsSync(agentMetricsPath)) {
    agentMetrics = JSON.parse(fs.readFileSync(agentMetricsPath, "utf8"));
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
      agent: agentMetrics?.tradicional || null,
    },
    modular: {
      ...modular,
      git_delta: cleanGit(modGit),
      agent: agentMetrics?.modular || null,
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
    `## 1. Métricas Estruturais, Reutilização e Duplicação`,
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
    `| Imports internos de componentes | ${t.reuse.internal_imports_total} | ${m.reuse.internal_imports_total} | ${m.reuse.internal_imports_total - t.reuse.internal_imports_total} |`,
    `| Componentes internos reutilizados | ${t.reuse.distinct_internal_components_imported} | ${m.reuse.distinct_internal_components_imported} | ${m.reuse.distinct_internal_components_imported - t.reuse.distinct_internal_components_imported} |`,
  ];

  if (t.git_delta && m.git_delta) {
    lines.push(
      ``,
      `## 2. Delta Git da Etapa (${t.git_delta.base_ref} -> ${t.git_delta.target_ref})`,
      ``,
      `| Métrica de Alteração | Tradicional | Modular | Diferença (Mod - Trad) |`,
      `|---|---:|---:|---:|`,
      `| Arquivos criados (A) | ${t.git_delta.files_added} | ${m.git_delta.files_added} | ${m.git_delta.files_added - t.git_delta.files_added} |`,
      `| Arquivos modificados (M) | ${t.git_delta.files_modified} | ${m.git_delta.files_modified} | ${m.git_delta.files_modified - t.git_delta.files_modified} |`,
      `| Total de arquivos tocados (Blast Radius) | ${t.git_delta.files_touched_total} | ${m.git_delta.files_touched_total} | ${m.git_delta.files_touched_total - t.git_delta.files_touched_total} |`,
      `| Linhas adicionadas (+) | ${t.git_delta.lines_added} | ${m.git_delta.lines_added} | ${m.git_delta.lines_added - t.git_delta.lines_added} |`,
      `| Linhas removidas (-) | ${t.git_delta.lines_removed} | ${m.git_delta.lines_removed} | ${m.git_delta.lines_removed - t.git_delta.lines_removed} |`,
      `| Churn bruto (+ / -) | ${t.git_delta.total_lines_churn} | ${m.git_delta.total_lines_churn} | ${m.git_delta.total_lines_churn - t.git_delta.total_lines_churn} |`
    );
  }

  if (t.agent && m.agent) {
    lines.push(
      ``,
      `## 3. Esforço Operacional do Agente de IA`,
      ``,
      `| Métrica do Agente | Tradicional | Modular | Diferença (Mod - Trad) |`,
      `|---|---:|---:|---:|`,
      `| Pass@1 (Acerto de 1ª) | ${t.agent.pass_at_1 ? "Sim" : "Não"} | ${m.agent.pass_at_1 ? "Sim" : "Não"} | — |`,
      `| Ciclos de validação | ${t.agent.validation_cycles} | ${m.agent.validation_cycles} | ${m.agent.validation_cycles - t.agent.validation_cycles} |`,
      `| Leituras de arquivos | ${t.agent.files_read} | ${m.agent.files_read} | ${m.agent.files_read - t.agent.files_read} |`,
      `| Escritas/edições de arquivos | ${t.agent.files_written} | ${m.agent.files_written} | ${m.agent.files_written - t.agent.files_written} |`,
      `| Total de Tool Calls | ${t.agent.tool_calls_total} | ${m.agent.tool_calls_total} | ${m.agent.tool_calls_total - t.agent.tool_calls_total} |`,
      `| Duração do subagente (s) | ${t.agent.duration_seconds}s | ${m.agent.duration_seconds}s | ${(m.agent.duration_seconds - t.agent.duration_seconds).toFixed(1)}s |`
    );
  }

  return [
    ...lines,
    ``,
    `## Glossário das Métricas (Para Referência no TCC)`,
    ``,
    `- **Arquivos JS autorais**: Quantidade total de arquivos \`.js\` que compõem a suíte (\`tradicional/\` vs. \`modular/\`, incluindo todas as camadas e helpers).`,
    `- **Linhas físicas (LOC)**: Total de linhas dos arquivos, incluindo linhas em branco.`,
    `- **Linhas lógicas (SLOC)**: Total de linhas contendo código efetivo (descontando linhas em branco e comentários).`,
    `- **Total de tokens JS**: Quantidade total de elementos léxicos da linguagem (identificadores, palavras-chave, operadores, literais).`,
    `- **Clones detectados / Tokens e Linhas duplicadas (%)**: Mede a taxa de código repetido (copiado/colado) dentro da própria suíte usando janelas mínimas de 25 tokens consecutivos idênticos.`,
    `- **Imports internos / Componentes reutilizados**: Quantidade de conexões \`import\` internas e de arquivos/módulos da própria suíte que são reaproveitados por outros arquivos.`,
    `- **Blast Radius (Superfície de Impacto)**: Total de arquivos criados (\`A\`), modificados (\`M\`) ou removidos (\`D\`) no Git para entregar a etapa.`,
    `- **Pass@1 e Ciclos de validação**: Indica se o subagente de IA aprovou 100% dos checks no validador HTTP real na primeira tentativa (\`Pass@1\`) e quantas execuções do validador foram necessárias.`,
  ].join("\n") + "\n";
}

function parseCliArgs(argv) {
  const args = {
    state: "E0",
    base: null,
    target: "HEAD",
    validation: null,
    agentMetrics: null,
    outDir: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--state") args.state = argv[++i];
    else if (arg === "--base") args.base = argv[++i];
    else if (arg === "--target") args.target = argv[++i];
    else if (arg === "--validation") args.validation = argv[++i];
    else if (arg === "--agent-metrics") args.agentMetrics = argv[++i];
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
