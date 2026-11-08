import test from "node:test";
import assert from "node:assert/strict";
import {
  countLinesAndSloc,
  tokenizeJs,
  computeCodeDuplication,
  extractImports,
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

test("computeCodeDuplication detecta blocos idênticos >= minTokens", () => {
  const repeatedBlock = `
    const res = http.post(\`\${BASE_URL}/auth/login\`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
  `;
  const f1 = {
    relPath: "tradicional/a.js",
    logicalLines: 5,
    tokens: tokenizeJs(repeatedBlock),
  };
  const f2 = {
    relPath: "tradicional/b.js",
    logicalLines: 5,
    tokens: tokenizeJs(repeatedBlock),
  };
  const dup = computeCodeDuplication([f1, f2], 15);
  assert.ok(dup.clones_count >= 1);
  assert.equal(dup.duplication_tokens_pct, 100);
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
  assert.ok(report.tradicional.duplication.duplication_tokens_pct > report.modular.duplication.duplication_tokens_pct);
});
