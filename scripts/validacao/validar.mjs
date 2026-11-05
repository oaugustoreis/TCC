// Alternativa sem Python; mesmos cenários e critérios de validar.py.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(root, 'evidencias/validacao_final', stamp);
fs.mkdirSync(out, { recursive: true });
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const rel = p => path.relative(root, p).split(path.sep).join('/');
function inventory() {
  const result = {};
  function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.js')) result[rel(p)] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  } }
  for (const dir of ['modular', 'tradicional', 'shared', 'api']) walk(path.join(root, dir));
  return result;
}
function command(args, folder, name, timeout = 30000) {
  const started_utc = new Date().toISOString();
  const r = spawnSync(args[0], args.slice(1), { cwd: root, encoding: 'utf8', timeout, windowsHide: true });
  const record = { command: args, cwd: root, started_utc, exit_code: r.status ?? 127, error: r.error?.message };
  write(path.join(folder, name + '.command.json'), record);
  fs.writeFileSync(path.join(folder, name + '.stdout.log'), r.stdout || '');
  fs.writeFileSync(path.join(folder, name + '.stderr.log'), (r.stderr || '') + (r.error?.message || ''));
  return { ...record, stdout: r.stdout || '' };
}
const lines = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean).map(s => JSON.parse(s)) : [];
const before = inventory();
write(path.join(out, 'source-manifest-before.json'), before);
const modular = Object.keys(before).filter(p => p.startsWith('modular/'));
write(path.join(out, 'code-accounting.json'), { expected_file_count: 24, actual_file_count: modular.length,
  included_in_modular_code_metrics: modular, http_helper_included: modular.includes('modular/helpers/http/http.js'),
  checks_helper_included: modular.includes('modular/helpers/checks/checks.js'),
  note: 'Inventário de escopo e hashes; sem experimentos definitivos ou coleta de LOC/duplicação/manutenção/reutilização.' });
const tools = {};
for (const [name, args] of Object.entries({ node: ['node', '--version'], k6: ['k6', 'version'], npm: ['cmd.exe', '/d', '/c', 'npm.cmd --version'], python: ['python', '--version'], python3: ['python3', '--version'], git: ['git', 'rev-parse', 'HEAD'] })) tools[name] = command(args, out, name);
write(path.join(out, 'environment.json'), { utc: stamp, platform: os.platform(), release: os.release(), arch: os.arch(), tools });
// Sondagem npm opcional; os cenários usam instâncias independentes na porta 3334.
if (process.argv.includes('--probe-npm-api')) {
const npmArgs = ['cmd.exe', '/d', '/c', 'npm.cmd run api'];
write(path.join(out, 'npm-api.command.json'), { command: npmArgs, cwd: root, started_utc: new Date().toISOString() });
const npmOut = fs.openSync(path.join(out, 'npm-api.stdout.log'), 'w');
const npmErr = fs.openSync(path.join(out, 'npm-api.stderr.log'), 'w');
const npmApi = spawn(npmArgs[0], npmArgs.slice(1), { windowsHide: true, stdio: ['ignore', npmOut, npmErr] });
await new Promise(r => setTimeout(r, 1500));
try { const r = await fetch('http://127.0.0.1:3333/health', { signal: AbortSignal.timeout(3000) }); write(path.join(out, 'npm-api-health.json'), { status: r.status, body: await r.text() }); }
catch (e) { write(path.join(out, 'npm-api-health.json'), { error: e.message }); }
command(['taskkill', '/PID', String(npmApi.pid), '/T', '/F'], out, 'npm-api-stop');
npmApi.kill();
await new Promise(r => npmApi.exitCode !== null ? r() : npmApi.once('exit', r));
fs.closeSync(npmOut); fs.closeSync(npmErr);
write(path.join(out, 'npm-api-exit.json'), { exit_code: npmApi.exitCode });
}
for (const [name, args] of Object.entries({ 'api-test': ['cmd.exe', '/d', '/c', 'npm.cmd run api:test'], 'http-helper': ['node', '--experimental-vm-modules', 'tests/http-helper.test.js'], 'checks-helper': ['node', '--experimental-vm-modules', 'tests/checks-helper.test.js'] })) command(args, out, name);
const scenarios = [
 ['ct01', 'autenticacao/autenticacao', 1, ['login 200', 'token presente']],
 ['ct02', 'catalogo/catalogo', 3, ['login 200', 'token presente', 'lista 200', 'produtos disponíveis', 'produto 200', 'produto p1']],
 ['ct03', 'pedidos/criacao', 3, ['login 200', 'token presente', 'produto 200', 'produto p1', 'pedido 201', 'pedido criado']],
 ['ct04', 'pedidos/consulta', 3, ['login 200', 'token presente', 'pedido 201', 'pedido criado', 'consulta 200', 'pedido corresponde', 'status esperado']],
 ['ct05', 'pedidos/atualizacao', 4, ['login 200', 'token presente', 'pedido 201', 'pedido criado', 'atualização 200', 'status confirmado', 'consulta 200', 'pedido corresponde', 'status esperado']],
];
const pairs = [];
for (const [ct, journey, expectedRequests, expectedChecks] of scenarios) {
  const runs = [];
  for (const group of ['tradicional', 'modular']) {
    const folder = path.join(out, `${group}_${ct}`); fs.mkdirSync(folder);
    const script = group === 'tradicional' ? `tradicional/${ct}.js` : `modular/scenarios/${journey}.scenario.js`;
    const inspection = command(['k6', 'inspect', script], folder, 'inspect');
    let options = {}; try { options = JSON.parse(inspection.stdout); } catch {}
    const effective = group === 'tradicional' ? options : options.scenarios?.[ct] || {};
    const profileValid = effective.vus === 1 && effective.iterations === 1 && (group === 'tradicional' || effective.executor === 'shared-iterations');
    write(path.join(folder, 'effective-options.json'), { ...effective, valid: profileValid });
    const apiEnv = { PORT: '3334', TRACE_FILE: path.join(folder, 'server-requests.jsonl'), READY_FILE: path.join(folder, 'api-ready.json') };
    write(path.join(folder, 'api.command.json'), { command: ['node', 'scripts/validacao/api-observada.mjs'], cwd: root, environment: apiEnv });
    const stdout = fs.openSync(path.join(folder, 'api.stdout.log'), 'w');
    const stderr = fs.openSync(path.join(folder, 'api.stderr.log'), 'w');
    const api = spawn('node', ['scripts/validacao/api-observada.mjs'], { env: { ...process.env, ...apiEnv }, windowsHide: true, stdio: ['ignore', stdout, stderr] });
    const deadline = Date.now() + 5000;
    while (!fs.existsSync(apiEnv.READY_FILE) && api.exitCode === null && Date.now() < deadline) await new Promise(r => setTimeout(r, 50));
    const ready = fs.existsSync(apiEnv.READY_FILE) && api.exitCode === null;
    let result;
    try { result = command(['k6', 'run', '--no-usage-report', '--no-color', '--quiet', '--log-format=json', '--log-output', `file=${path.join(folder, 'http-debug.jsonl')}`, '--http-debug=full', '--summary-export', path.join(folder, 'summary.json'), '--out', `json=${path.join(folder, 'metrics.jsonl')}`, '-e', 'BASE_URL=http://127.0.0.1:3334', script], folder, 'k6-run'); }
    finally { api.kill(); await new Promise(r => api.exitCode !== null ? r() : api.once('exit', r)); fs.closeSync(stdout); fs.closeSync(stderr); write(path.join(folder, 'api-exit.json'), { exit_code: api.exitCode }); }
    const points = lines(path.join(folder, 'metrics.jsonl')).filter(m => m.type === 'Point');
    const checks = points.filter(m => m.metric === 'checks').map(m => ({ name: m.data.tags.check, value: m.data.value, time: m.data.time }));
    const http = points.filter(m => m.metric === 'http_reqs').map(m => m.data);
    const iterations = points.filter(m => m.metric === 'iterations').reduce((n, m) => n + m.data.value, 0);
    const received = lines(path.join(folder, 'server-requests.jsonl'));
    write(path.join(folder, 'checks.json'), checks); write(path.join(folder, 'http-request-metrics.json'), http);
    const httpCount = http.reduce((n, m) => n + m.value, 0);
    const realSuccess = ready && result.exit_code === 0 && inspection.exit_code === 0 && profileValid && received.length === expectedRequests && httpCount === expectedRequests && iterations === 1 && JSON.stringify(checks.map(c => c.name)) === JSON.stringify(expectedChecks) && checks.every(c => c.value === 1);
    const record = { scenario: ct, suite: group, script, api_ready: ready, exit_code: result.exit_code, profile_valid: profileValid, expected_requests: expectedRequests, received_requests: received.length, http_reqs: httpCount, iterations, expected_checks: expectedChecks.length, observed_checks: checks.length, passed_checks: checks.filter(c => c.value === 1).length, real_success: realSuccess };
    write(path.join(folder, 'result.json'), record); runs.push({ record, received, checks });
  }
  const success = runs.every(r => r.record.real_success);
  const canonical = r => r.received.map(({ method, path, headers, payload }) => ({ method, path, headers: Object.fromEntries(Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))), payload }));
  const equal = f => success ? JSON.stringify(f(runs[0])) === JSON.stringify(f(runs[1])) : null;
  const requests_equal = equal(canonical);
  const checks_equal = equal(r => r.checks.map(({ name, value }) => ({ name, value })));
  const response_statuses_equal = equal(r => r.received.map(x => x.status));
  const pair = { scenario: ct, runs: runs.map(r => r.record), requests_equal, checks_equal, response_statuses_equal, equivalent: success && requests_equal && checks_equal && response_statuses_equal };
  write(path.join(out, `${ct}-comparison.json`), pair); pairs.push(pair); console.log(JSON.stringify(pair));
}
const after = inventory(); write(path.join(out, 'source-manifest-after.json'), after);
const preserved = JSON.stringify(before) === JSON.stringify(after) && modular.length === 24;
const complete = preserved && pairs.every(p => p.equivalent);
write(path.join(out, 'result.json'), { complete_functional_equivalence: complete, architecture_preserved: preserved, pairs });
fs.writeFileSync(path.join(root, 'evidencias/validacao_final/ultima_execucao.txt'), rel(out) + '\n');
console.log(`EVIDENCIAS=${out}`); process.exitCode = complete ? 0 : 1;
