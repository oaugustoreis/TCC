#!/usr/bin/env node
// Sensibilidade da duplicação lexical ao limiar de janela (minTokens), sobre as suítes do estado atual (E4).
// Usa o mesmo detector do coletor (exact-token-window-union-v1). Uso: node scripts/metricas/sensibilidade-limiar.mjs [--saida arquivo.csv]
import fs from "node:fs";
import path from "node:path";
import { listJsFiles, tokenizeJs, countLinesAndSloc, computeCodeDuplication } from "./coletar-metricas.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const LIMIARES = [10, 15, 20, 25, 30, 40, 50, 75, 100];
const i = process.argv.indexOf("--saida");
const saida = i > 0 ? process.argv[i + 1] : null;

function carregar(suite) {
  return listJsFiles(path.join(ROOT, suite), ROOT).map((rel) => {
    const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    return { relPath: rel, tokens: tokenizeJs(content), ...countLinesAndSloc(content) };
  });
}
const dados = { tradicional: carregar("tradicional"), modular: carregar("modular") };
const linhas = ["limiar,tradicional_pct,modular_pct,diferenca_pp,razao_mod_trad"];
for (const L of LIMIARES) {
  const t = computeCodeDuplication(dados.tradicional, L).duplication_tokens_pct;
  const m = computeCodeDuplication(dados.modular, L).duplication_tokens_pct;
  linhas.push([L, t.toFixed(2), m.toFixed(2), (t - m).toFixed(2), (m / t).toFixed(3)].join(","));
}
const txt = linhas.join("\n");
console.log(txt);
if (saida) fs.writeFileSync(saida, txt + "\n");
