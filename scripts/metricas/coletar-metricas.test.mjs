import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  countLinesAndSloc,
  tokenizeJs,
  computeCodeDuplication,
  extractImports,
  computeBatchReuse,
  parseSubagentTranscript,
  parseValidationAttempts,
  collectStageMetrics,
} from "./coletar-metricas.mjs";

test("countLinesAndSloc conta linhas físicas e lógicas ignorando comentários", () => {
  const sample = [
    "// comentario inicial",
    "import { x } from './a.js';",
    "",
    "/* bloco",
    "   de comentario */",
    "const a = 1;",
  ].join("\n");
  const res = countLinesAndSloc(sample);
  assert.equal(res.physicalLines, 6);
  assert.equal(res.logicalLines, 2);
});

test("computeCodeDuplication usa união sem contagem dupla em janelas sobrepostas e separa intra/inter arquivo", () => {
  const block30Tokens = `
    const res = http.post(\`\${BASE_URL}/auth/login\`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
  `;
  const tokens = tokenizeJs(block30Tokens);
  assert.ok(tokens.length > 25);

  const f1 = { relPath: "tradicional/a.js", logicalLines: 5, tokens };
  const f2 = { relPath: "tradicional/b.js", logicalLines: 5, tokens };

  const dup = computeCodeDuplication([f1, f2], 25);
  assert.equal(dup.clones_count, 1);
  assert.equal(dup.cross_file_clones_count, 1);
  assert.equal(dup.intra_file_clones_count, 0);
  // Mesmo com várias janelas de 25 tokens sobrepostas, duplicated_tokens não ultrapassa total_tokens
  assert.equal(dup.duplicated_tokens, dup.total_tokens);
  assert.equal(dup.duplication_tokens_pct, 100);
});

test("computeCodeDuplication detecta clone intra-arquivo e não cruza fronteira entre arquivos", () => {
  const snippet = `const x = a + b + c + d + e + f + g + h + i + j + k + l;`;
  const intraCode = `${snippet}\nconst middle = 999;\n${snippet}`;
  const fIntra = {
    relPath: "tradicional/intra.js",
    logicalLines: 3,
    tokens: tokenizeJs(intraCode),
  };
  const dupIntra = computeCodeDuplication([fIntra], 10);
  assert.equal(dupIntra.intra_file_clones_count, 1);
  assert.equal(dupIntra.cross_file_clones_count, 0);

  // Dois arquivos curtos (< minTokens cada) não devem formar clone cruzando a fronteira entre eles
  const shortTokens = tokenizeJs("const a = 1 + 2 + 3;");
  const fShort1 = { relPath: "tradicional/s1.js", logicalLines: 1, tokens: shortTokens };
  const fShort2 = { relPath: "tradicional/s2.js", logicalLines: 1, tokens: shortTokens };
  const dupBoundary = computeCodeDuplication([fShort1, fShort2], shortTokens.length + 1);
  assert.equal(dupBoundary.clones_count, 0);
  assert.equal(dupBoundary.duplicated_tokens, 0);
});

test("computeBatchReuse contabiliza somente dependências dos arquivos tocados no lote (A ou M)", () => {
  const filesMap = new Map([
    [
      "modular/scenarios/antigo.scenario.js",
      {
        imports: [{ type: "relative", resolved: "modular/use-cases/antigo.useCase.js" }],
      },
    ],
    [
      "modular/use-cases/antigo.useCase.js",
      {
        imports: [{ type: "relative", resolved: "modular/helpers/http/http.js" }],
      },
    ],
    [
      "modular/scenarios/novo.scenario.js",
      {
        imports: [{ type: "relative", resolved: "modular/flows/novo.flow.js" }],
      },
    ],
    [
      "modular/flows/novo.flow.js",
      {
        imports: [
          { type: "relative", resolved: "modular/use-cases/login.useCase.js" },
          { type: "relative", resolved: "modular/use-cases/estoque.useCase.js" },
        ],
      },
    ],
    [
      "modular/use-cases/login.useCase.js",
      {
        imports: [{ type: "relative", resolved: "modular/helpers/http/http.js" }],
      },
    ],
    [
      "modular/use-cases/estoque.useCase.js",
      {
        imports: [{ type: "relative", resolved: "modular/helpers/http/http.js" }],
      },
    ],
    ["modular/helpers/http/http.js", { imports: [] }],
  ]);

  // No lote, apenas novo.scenario.js (A), novo.flow.js (A) e estoque.useCase.js (A) foram criados;
  // login.useCase.js e http.js já existiam e não foram modificados; antigo.useCase.js não participou do lote.
  const statusMap = new Map([
    ["modular/scenarios/novo.scenario.js", "A"],
    ["modular/flows/novo.flow.js", "A"],
    ["modular/use-cases/estoque.useCase.js", "A"],
  ]);

  const batchReuse = computeBatchReuse("modular", filesMap, statusMap);
  assert.equal(batchReuse.batch_reused_unmodified_count, 2); // login.useCase.js e http.js
  assert.equal(batchReuse.batch_created_shared_count, 2); // novo.flow.js e estoque.useCase.js
  assert.equal(batchReuse.batch_reused_modified_count, 0);
  // Verifica que antigo.useCase.js NÃO entrou na conta do lote
  assert.ok(!batchReuse.components.some((c) => c.component.includes("antigo.useCase.js")));
});

test("parseSubagentTranscript e parseValidationAttempts extraem dados auditáveis e separam falhas de infra", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tcc-metrics-test-"));
  const transcriptFile = path.join(tmpDir, "transcript.jsonl");
  const lines = [
    JSON.stringify({
      step_index: 1,
      type: "USER_INPUT",
      created_at: "2026-11-08T15:00:00.000Z",
    }),
    JSON.stringify({
      step_index: 2,
      type: "PLANNER_RESPONSE",
      created_at: "2026-11-08T15:00:10.000Z",
      tool_calls: [
        { name: "read_file" },
        { name: "read_file" },
        { name: "write_file" },
        { name: "edit_file" },
        { name: "run_command" },
      ],
    }),
    JSON.stringify({
      step_index: 3,
      type: "PLANNER_RESPONSE",
      created_at: "2026-11-08T15:00:25.500Z",
      tool_calls: [],
    }),
  ];
  fs.writeFileSync(transcriptFile, lines.join("\n"), "utf8");

  const parsedTranscript = parseSubagentTranscript(transcriptFile);
  assert.equal(parsedTranscript.available, true);
  assert.equal(parsedTranscript.files_read, 2);
  assert.equal(parsedTranscript.files_written, 2);
  assert.equal(parsedTranscript.commands_run, 1);
  assert.equal(parsedTranscript.tool_calls_total, 5);
  assert.equal(parsedTranscript.duration_seconds, 25.5);

  const attempt1Dir = path.join(tmpDir, "attempt-01");
  const attempt2Dir = path.join(tmpDir, "attempt-02");
  const attempt3Dir = path.join(tmpDir, "attempt-03");
  fs.mkdirSync(attempt1Dir);
  fs.mkdirSync(attempt2Dir);
  fs.mkdirSync(attempt3Dir);

  // Tentativa 1: falha de infraestrutura (api_ready: false) -> não deve invalidar first_validation_pass funcional
  fs.writeFileSync(
    path.join(attempt1Dir, "result.json"),
    JSON.stringify({ validation_passed: false, runs: [{ api_ready: false }] }),
    "utf8"
  );
  // Tentativa 2: 1ª execução funcional válida -> reprovada funcionalmente
  fs.writeFileSync(
    path.join(attempt2Dir, "result.json"),
    JSON.stringify({ validation_passed: false, runs: [{ api_ready: true }] }),
    "utf8"
  );
  // Tentativa 3: 2ª execução funcional válida -> aprovada
  fs.writeFileSync(
    path.join(attempt3Dir, "result.json"),
    JSON.stringify({ validation_passed: true, runs: [{ api_ready: true }] }),
    "utf8"
  );

  const valParsed = parseValidationAttempts(tmpDir);
  assert.equal(valParsed.available, true);
  assert.equal(valParsed.infra_error_runs, 1);
  assert.equal(valParsed.functional_validation_cycles, 2);
  assert.equal(valParsed.first_validation_pass, false);
  assert.equal(valParsed.final_validation_passed, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("extractImports resolve caminhos relativos ESM corretamente", () => {
  const code = `
    import { smokeProfile } from "../../profiles/comum/smoke.profile.js";
    import http from "k6/http";
  `;
  const imports = extractImports("modular/scenarios/pedidos/criacao.scenario.js", code);
  assert.equal(imports.length, 2);
  assert.equal(imports[0].resolved, "modular/profiles/comum/smoke.profile.js");
  assert.equal(imports[1].type, "external");
});

test("collectStageMetrics analisa baseline E0 (5 tradicionais vs 24 modulares)", () => {
  const report = collectStageMetrics({ stateId: "E0" });
  assert.equal(report.tradicional.files_count, 5);
  assert.equal(report.modular.files_count, 24);
  assert.equal(report.tradicional.batch_reuse, null);
  assert.ok(
    report.tradicional.duplication.duplication_tokens_pct >
      report.modular.duplication.duplication_tokens_pct
  );
});
