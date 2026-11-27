#!/usr/bin/env node
// Valida uma manutenção (M1–M3) feita por um agente sobre uma cópia do estado E4.
// 1) Aplica à API da cópia a mudança de contrato da tarefa (variante "correta") e roda as 15 jornadas da suíte: todas devem passar.
// 2) Roda as mesmas jornadas contra uma variante "mutante" da API (valor do campo errado): as jornadas afetadas devem FALHAR,
//    o que comprova que a suíte realmente verifica o novo contrato.
// Uso: node scripts/validacao/validar-manutencao.mjs --raiz /tmp/m/run1 --tarefa M1 --suite modular --k6 /caminho/k6 [--api-base api/server.js de E4]
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const RAIZ = path.resolve(arg('raiz')), TAREFA = arg('tarefa'), SUITE = arg('suite'), K6 = arg('k6', 'k6');
const base = fs.readFileSync(arg('api-base', path.join(RAIZ, 'api/server.js')), 'utf8'); // API de E4 sem a mudança (a cópia do agente já pode conter a API da tarefa)
const sub = (s, a, b) => { if (!s.includes(a)) throw new Error('trecho da API não encontrado: ' + a.slice(0, 50)); return s.replace(a, b); };
const variantes = {
  M1: (bom) => sub(base, "send(res, 200, { token: TOKEN, tokenType: 'Bearer' })", `send(res, 200, { token: TOKEN, tokenType: 'Bearer', expiresIn: ${bom ? 3600 : 7200} })`),
  M2: (bom) => { let s = sub(base, "const body = await parseBody(req);\n    if (body && body.cartId !== undefined) {", `const body = await parseBody(req);\n    if (!body || body.currency !== 'BRL')\n      return send(res, 400, { error: 'Pedido inválido' });\n    if (body && body.cartId !== undefined) {`);
    s = sub(s, "total: cart.total,\n       status: 'created',", `total: cart.total,\n       currency: '${bom ? 'BRL' : 'USD'}',\n       status: 'created',`);
    return sub(s, "quantity: body.quantity, status: 'created' };", `quantity: body.quantity, currency: '${bom ? 'BRL' : 'USD'}', status: 'created' };`); },
  M3: (bom) => { const v = bom ? 'new Date().toISOString()' : "''"; let s = sub(base, "total: cart.total,\n       status: 'created',", `total: cart.total,\n       status: 'created',\n       createdAt: ${v},`);
    return sub(s, "quantity: body.quantity, status: 'created' };", `quantity: body.quantity, status: 'created', createdAt: ${v} };`); },
};
const listar = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listar(path.join(d, e.name)) : [path.join(d, e.name)]);
const entradas = {};
if (SUITE === 'modular') for (const f of listar(path.join(RAIZ, 'modular/scenarios'))) { const m = fs.readFileSync(f, 'utf8').match(/scenarios:\s*\{\s*(ct\d\d)/); if (m) entradas[m[1]] = f; }
else for (const f of listar(path.join(RAIZ, SUITE))) { const m = f.match(/(ct\d\d)\.js$/); if (m && !f.includes(path.sep + 'lib' + path.sep)) entradas[m[1]] = f; }
async function rodar(bom) {
  const dir = path.join(RAIZ, bom ? 'api-bom' : 'api-mutante'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'server.js'), variantes[TAREFA](bom));
  const resultado = {};
  for (const [id, f] of Object.entries(entradas).sort()) {
    const porta = 4100 + Math.floor(Math.random() * 800);
    const api = spawn('node', [path.join(dir, 'server.js')], { env: { ...process.env, PORT: String(porta) }, stdio: 'ignore' });
    await new Promise((r) => setTimeout(r, 400));
    const r = spawnSync(K6, ['run', '--quiet', '--no-usage-report', '-e', `BASE_URL=http://127.0.0.1:${porta}`, f], { cwd: RAIZ, encoding: 'utf8', timeout: 30000 });
    api.kill(); await new Promise((r2) => setTimeout(r2, 100));
    resultado[id] = r.status;
  }
  return resultado;
}
const bom = await rodar(true), mut = await rodar(false);
const falhasBom = Object.entries(bom).filter(([, s]) => s !== 0).map(([i]) => i);
const detectadas = Object.entries(mut).filter(([, s]) => s !== 0).map(([i]) => i);
const saida = { tarefa: TAREFA, suite: SUITE, jornadas: Object.keys(entradas).length, passam_com_api_correta: Object.keys(bom).length - falhasBom.length, falham_com_api_correta: falhasBom, falham_com_api_mutante: detectadas.length, jornadas_que_detectam_mutante: detectadas };
console.log(JSON.stringify(saida));
