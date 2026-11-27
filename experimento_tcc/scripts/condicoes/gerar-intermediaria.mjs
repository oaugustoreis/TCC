// Gera a condição intermediária a partir do estado E4 da suíte modular:
// um script autônomo por jornada (como na condição independente), mas com as operações HTTP e os checks
// compartilhados (use-cases e helpers da modular, copiados para intermediaria/lib/).
// Não há Profile, Scenario nem Flow: o corpo de cada Flow é incorporado ao script da jornada.
// Uso: node scripts/condicoes/gerar-intermediaria.mjs
import fs from "node:fs";
import path from "node:path";
const RAIZ = path.resolve(import.meta.dirname, "../..");
const MOD = path.join(RAIZ, "modular"), DEST = path.join(RAIZ, "intermediaria");
fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(path.join(MOD, "use-cases"), path.join(DEST, "lib/use-cases"), { recursive: true });
fs.cpSync(path.join(MOD, "helpers"), path.join(DEST, "lib/helpers"), { recursive: true });
const listar = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listar(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0;
for (const sc of listar(path.join(MOD, "scenarios")).filter((f) => f.endsWith(".scenario.js"))) {
  const s = fs.readFileSync(sc, "utf8");
  const id = s.match(/scenarios:\s*\{\s*(ct\d\d)\s*:/)[1];
  const flowRel = s.match(/from "(\.\.\/\.\.\/flows\/[^"]+)"/)[1];
  const flowSrc = fs.readFileSync(path.resolve(path.dirname(sc), flowRel), "utf8").replace(/\r\n/g, "\n");
  const m = flowSrc.match(/^export function \w+\(\{ baseUrl, credentials \}\) \{\n([\s\S]*)\n\}\s*$/m);
  const imports = flowSrc.slice(0, m.index).replace(/"\.\.\/\.\.\/use-cases\//g, '"./lib/use-cases/').trimEnd();
  const corpo = m[1];
  const out = `import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";\n${imports}\n\nexport const options = OPTIONS;\n\nexport default function () {\n    const baseUrl = BASE_URL;\n    const credentials = CREDENTIALS;\n${corpo}\n}\n`;
  fs.mkdirSync(DEST, { recursive: true });
  fs.writeFileSync(path.join(DEST, `${id}.js`), out); n++;
}
console.log(`${n} scripts gerados em intermediaria/`);
