// Métricas estáticas (arquivos, SLOC, tokens, duplicação lexical) das três condições em E4.
// Uso: node scripts/metricas/comparar-tres-condicoes.mjs
import fs from "node:fs";
import path from "node:path";
import { tokenizeJs, countLinesAndSloc, computeCodeDuplication } from "./coletar-metricas.mjs";
const RAIZ = path.resolve(import.meta.dirname, "../..");
const listar = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listar(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []).sort();
console.log("condicao,arquivos,sloc,tokens,limiar,tokens_dup_pct");
for (const c of ["tradicional", "intermediaria", "modular"]) {
  const fd = listar(path.join(RAIZ, c)).map((f) => { const t = fs.readFileSync(f, "utf8"); return { relPath: path.relative(RAIZ, f), tokens: tokenizeJs(t), logicalLines: countLinesAndSloc(t).logicalLines }; });
  const sloc = fd.reduce((a, f) => a + f.logicalLines, 0), tok = fd.reduce((a, f) => a + f.tokens.length, 0);
  for (const lim of [25, 50]) console.log(`${c},${fd.length},${sloc},${tok},${lim},${computeCodeDuplication(fd, lim).duplication_tokens_pct}`);
}
