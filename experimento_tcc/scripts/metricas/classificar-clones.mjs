// Classifica as regiões duplicadas (janela de 25 tokens) de uma suíte, por camada e por tipo de conteúdo.
// Uso: node scripts/metricas/classificar-clones.mjs <diretorio> [minTokens]
import fs from "node:fs";
import path from "node:path";
import { tokenizeJs } from "./coletar-metricas.mjs";

const dir = process.argv[2] ?? "modular";
const MIN = Number(process.argv[3] ?? 25);
const list = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? list(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []).sort();
const files = list(dir).map((f) => ({ f, rel: path.relative(dir, f).split(path.sep).join("/"), tokens: tokenizeJs(fs.readFileSync(f, "utf8")) }));
const layer = (rel) => rel.split("/")[0] === "use-cases" ? "Use Case" : rel.startsWith("flows") ? "Flow" : rel.startsWith("scenarios") ? "Scenario"
  : rel.startsWith("profiles") ? "Profile" : rel.startsWith("helpers") ? "Helper" : "tradicional";
const map = new Map();
for (const fi of files) for (let i = 0; i + MIN <= fi.tokens.length; i++) {
  const s = fi.tokens.slice(i, i + MIN).map((t) => t.value).join(" ");
  (map.get(s) ?? map.set(s, []).get(s)).push({ file: fi.rel, i });
}
const dupPos = new Map(); // file -> Set of start positions that are dup windows, with occurrence info
for (const occ of map.values()) if (occ.length > 1) for (const o of occ)
  (dupPos.get(o.file) ?? dupPos.set(o.file, new Map()).get(o.file)).set(o.i, occ.map((x) => x.file).sort().join("|"));
const regions = [];
for (const [file, m] of dupPos) {
  const pos = [...m.keys()].sort((a, b) => a - b);
  let s = pos[0], prev = pos[0], files_ = new Set(m.get(s).split("|"));
  const flush = () => regions.push({ file, start: s, end: prev + MIN, with: [...files_].filter((x) => x !== file || true) });
  for (const p of pos.slice(1)) { if (p === prev + 1) { prev = p; m.get(p).split("|").forEach((x) => files_.add(x)); } else { flush(); s = prev = p; files_ = new Set(m.get(p).split("|")); } }
  flush();
}
const fl = Object.fromEntries(files.map((x) => [x.rel, x]));
const kind = (text, lay) => lay === "Flow"
  ? (/^[^;]*login \(/.test(text) || /login \( \{ baseUrl , credentials/.test(text) ? "prólogo de jornada (login e preparação)" : /^import /.test(text) ? "imports de Use Cases" : "sequência de Use Cases repetida entre Flows")
  : lay === "Use Case"
    ? (/checkResponse|bodyLabel|predicate/.test(text) ? "especificação de checks/campos repetida entre Use Cases" : "assinatura de parâmetros repetida")
    : "outro";
const dupTok = {}; const totTok = {};
for (const fi of files) { const L = layer(fi.rel); totTok[L] = (totTok[L] ?? 0) + fi.tokens.length; }
for (const r of regions) { /* união por arquivo */ }
const mark = {};
for (const [file, m] of dupPos) { const a = (mark[file] = new Uint8Array(fl0(file).tokens.length)); for (const p of m.keys()) a.fill(1, p, p + MIN); }
function fl0(rel) { return files.find((x) => x.rel === rel); }
for (const [file, a] of Object.entries(mark)) { const L = layer(file); dupTok[L] = (dupTok[L] ?? 0) + a.reduce((x, y) => x + y, 0); }
const out = regions.map((r) => {
  const text = fl[r.file].tokens.slice(r.start, r.end).map((t) => t.value).join(" ");
  const others = r.with.filter((x) => x !== r.file);
  return { file: r.file, layer: layer(r.file), tokens: r.end - r.start, kind: kind(text, layer(r.file)), mesmoArquivo: others.length === 0, outros: others.length, amostra: text.slice(0, 110) };
});
const by = (k) => out.reduce((a, o) => ((a[o[k]] = a[o[k]] ?? { regioes: 0, tokens: 0 }), a[o[k]].regioes++, a[o[k]].tokens += o.tokens, a), {});
console.log(JSON.stringify({ dir, minTokens: MIN, regioes: out.length, porCamada: by("layer"), porTipo: by("kind"), duplicacaoPorCamada: Object.fromEntries(Object.keys(totTok).map((L) => [L, { tokens: totTok[L], duplicados: dupTok[L] ?? 0, pct: Number((((dupTok[L] ?? 0) / totTok[L]) * 100).toFixed(1)) }])), regioesComOutrosArquivos: out.filter((o) => !o.mesmoArquivo).length }, null, 1));
if (process.argv.includes("--lista")) for (const o of out) console.log(`${o.layer}\t${o.kind}\t${o.tokens}\t${o.file}\t${o.amostra}`);
