#!/usr/bin/env node
// Custo de execução de duas suítes k6 (padrão: tradicional x modular; --a e --b escolhem outras condições).
// Mede, SEM alterar as suítes: (A) código empacotado pelo k6, (B) tempo de inicialização
// (k6 inspect), (C) tempo, CPU e memória de pico do processo k6 sob níveis de carga.
// Requer Linux ou WSL (lê /proc). Não mede o consumo da API sob teste.
//
// Uso (na raiz do experimento, experimento_tcc/):
//   node scripts/custo/medir-custo.mjs --k6 /caminho/k6 --reps 5 --saida evidencias/custo/rodada-01
// Opções: --a tradicional --b modular (também: intermediaria, esbuild/tradicional, esbuild/modular)  --entradas ct01,ct04  --niveis 1x1,10x100,50x200  --reps N  --porta 3350  --saida dir
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir, platform, release, cpus, totalmem } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const A = (() => { const i = process.argv.indexOf('--a'); return i > 0 ? process.argv[i + 1] : 'tradicional'; })();
const B = (() => { const i = process.argv.indexOf('--b'); return i > 0 ? process.argv[i + 1] : 'modular'; })();

// ---------- argumentos ----------
function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 ? process.argv[i + 1] : padrao;
}
const K6 = arg('k6', 'k6');
const REPS = Number(arg('reps', 5));
const PORTA = Number(arg('porta', 3350));
const NIVEIS = arg('niveis', '1x1,10x100,50x200').split(',').map((s) => {
  const [vus, iter] = s.split('x').map(Number);
  return { rotulo: s, vus, iter };
});
const SAIDA = resolve(RAIZ, arg('saida', `evidencias/custo/${new Date().toISOString().replace(/[:.]/g, '-')}`));
// CT-11 exige exatamente 1 pedido 'created' na listagem (estado vazio): só é válido com 1 iteração.
const EXCLUIR_CARGA = new Set(arg('excluir-carga', 'ct11').split(',').filter(Boolean));
const BASE_URL = `http://127.0.0.1:${PORTA}`;
const TICKS = Number(spawnSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }).stdout) || 100;

if (platform() !== 'linux') {
  console.error('Este script lê /proc e exige Linux ou WSL.');
  process.exit(2);
}

// ---------- entradas (CT-01..CT-15) das duas suítes ----------
function listar(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) listar(p, acc); else acc.push(p);
  }
  return acc;
}
const entradas = {};
function localizar(nome) {
  const r = {};
  if (nome === 'modular') {
    for (const f of listar(join(RAIZ, 'modular', 'scenarios'))) {
      const m = readFileSync(f, 'utf8').match(/scenarios:\s*\{\s*(ct\d{2})/);
      if (m) r[m[1]] = relative(RAIZ, f).split(sep).join('/');
    }
  } else {
    const dir = nome.startsWith('esbuild/') ? join(RAIZ, 'build-esbuild', nome.slice(8)) : join(RAIZ, nome);
    for (const f of listar(dir)) {
      const m = f.match(/(ct\d{2})\.js$/);
      if (m && !f.includes(`${sep}lib${sep}`)) r[m[1]] = relative(RAIZ, f).split(sep).join('/');
    }
  }
  return r;
}
for (const [id, f] of Object.entries(localizar(A))) (entradas[id] ??= {})[A] = f;
for (const [id, f] of Object.entries(localizar(B))) (entradas[id] ??= {})[B] = f;
const filtro = arg('entradas', '');
const ids = Object.keys(entradas).filter((id) => entradas[id][A] && entradas[id][B])
  .filter((id) => !filtro || filtro.split(',').includes(id)).sort();
if (!ids.length) { console.error('Nenhuma entrada encontrada.'); process.exit(2); }

// ---------- utilidades ----------
const ambienteLimpo = () => {
  const env = { ...process.env, BASE_URL };
  for (const k of Object.keys(env)) if (k.startsWith('K6_')) delete env[k]; // igual ao validador do projeto
  return env;
};
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const quantil = (a, q) => { const s = [...a].sort((x, y) => x - y); if (!s.length) return NaN; const p = (s.length - 1) * q; const lo = Math.floor(p); return s[lo] + (s[Math.ceil(p)] - s[lo]) * (p - lo); };
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : 'NA');
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

// Executa um processo e amostra /proc/<pid> (CPU acumulada e pico de RSS = VmHWM).
function medir(cmd, args, env) {
  return new Promise((ok) => {
    const t0 = process.hrtime.bigint();
    const p = spawn(cmd, args, { env, cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const amostra = { ut: 0, st: 0, hwm: 0, n: 0 };
    const tick = setInterval(() => {
      try {
        const s = readFileSync(`/proc/${p.pid}/stat`, 'utf8');
        const r = s.slice(s.lastIndexOf(')') + 2).split(' ');
        const h = readFileSync(`/proc/${p.pid}/status`, 'utf8').match(/VmHWM:\s+(\d+) kB/);
        amostra.ut = Number(r[11]); amostra.st = Number(r[12]);
        if (h) amostra.hwm = Math.max(amostra.hwm, Number(h[1]));
        amostra.n++;
      } catch { /* processo encerrou entre as leituras */ }
    }, 5);
    p.on('close', (codigo) => {
      clearInterval(tick);
      ok({
        wallMs: Number(process.hrtime.bigint() - t0) / 1e6,
        codigo, out, err,
        cpuUser: amostra.ut / TICKS, cpuSys: amostra.st / TICKS, rssKb: amostra.hwm, amostras: amostra.n,
      });
    });
  });
}

async function iniciarApi() {
  const api = spawn('node', ['api/server.js'], { cwd: RAIZ, env: { ...process.env, PORT: String(PORTA) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`${BASE_URL}/health`); if (r.ok) return api; } catch { /* ainda subindo */ }
    await dorme(50);
  }
  api.kill(); throw new Error('API não respondeu em /health');
}
async function pararApi(api) {
  await new Promise((ok) => { api.once('exit', ok); api.kill('SIGTERM'); });
}

// ---------- ambiente e integridade das fontes ----------
function sha(p) { return createHash('sha256').update(readFileSync(p)).digest('hex'); }
function ambiente() {
  const fontes = ['tradicional', 'modular', 'intermediaria', 'build-esbuild', 'shared', 'api'].filter((d) => { try { return statSync(join(RAIZ, d)).isDirectory(); } catch { return false; } }).flatMap((d) => listar(join(RAIZ, d)).filter((f) => f.endsWith('.js')))
    .map((f) => [relative(RAIZ, f).split(sep).join('/'), sha(f)]).sort();
  const git = (...a) => spawnSync('git', ['-C', RAIZ, ...a], { encoding: 'utf8' }).stdout?.trim();
  return {
    iniciadoEm: new Date().toISOString(),
    so: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model, nucleos: cpus().length, memoriaTotalMb: Math.round(totalmem() / 1048576),
    node: process.version,
    diretorioRaiz: RAIZ,
    sistemaDeArquivos: spawnSync('stat', ['-f', '-c', '%T', RAIZ], { encoding: 'utf8' }).stdout?.trim() || null,
    k6: spawnSync(K6, ['version'], { encoding: 'utf8' }).stdout?.trim(),
    git: { commit: git('rev-parse', 'HEAD') || null, alteracoesNaoCommitadas: (git('status', '--porcelain') || '').split('\n').filter(Boolean).length },
    parametros: { condicoes: [A, B], reps: REPS, niveis: NIVEIS, entradas: ids, porta: PORTA, ticksPorSegundo: TICKS },
    hashFontes: createHash('sha256').update(fontes.map((x) => x.join(' ')).join('\n')).digest('hex'),
    fontes: Object.fromEntries(fontes),
  };
}

// ---------- A) código empacotado (k6 archive) ----------
function empacotado(script) {
  const dir = mkdtempSync(join(tmpdir(), 'k6arq-'));
  const tar = join(dir, 'a.tar');
  const r = spawnSync(K6, ['archive', '-O', tar, script], { cwd: RAIZ, env: ambienteLimpo(), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`k6 archive falhou: ${r.stderr}`);
  const lista = spawnSync('tar', ['-tvf', tar], { encoding: 'utf8' }).stdout.split('\n');
  let bytes = 0, modulos = 0;
  for (const l of lista) {
    const c = l.trim().split(/\s+/);
    if (!l.startsWith('-')) continue;               // só arquivos regulares (ignora diretórios e links)
    const caminho = c.slice(5).join(' ');
    if (caminho === 'data' || caminho.startsWith('file/')) { bytes += Number(c[2]); modulos++; }
  }
  const tamanhoTar = statSync(tar).size;
  rmSync(dir, { recursive: true, force: true });
  return { modulos, bytesCodigo: bytes, bytesTar: tamanhoTar };
}

// ---------- execução ----------
mkdirSync(SAIDA, { recursive: true });
const amb = ambiente();
writeFileSync(join(SAIDA, 'ambiente.json'), JSON.stringify(amb, null, 2));
console.log(`Saída: ${SAIDA}\n${amb.k6} | ${amb.so} | ${amb.nucleos} núcleos | entradas: ${ids.join(',')}`);
if (amb.git.alteracoesNaoCommitadas) console.warn('AVISO: há alterações não commitadas; o hash das fontes identifica exatamente o que foi medido.');

// A
const estaticas = {};
for (const id of ids) for (const s of [A, B]) (estaticas[id] ??= {})[s] = empacotado(entradas[id][s]);
writeFileSync(join(SAIDA, 'empacotamento.json'), JSON.stringify(estaticas, null, 2));

// aquecimento (descartado): coloca binário e fontes no cache do SO
for (const s of [A, B]) for (let i = 0; i < 2; i++) await medir(K6, ['inspect', entradas[ids[0]][s]], ambienteLimpo());

// B
const linhasInit = ['suite,entrada,rep,inspect_ms'];
const init = [];
for (let r = 1; r <= REPS * 3; r++) {
  for (const id of ids) {
    const ordem = r % 2 ? [A, B] : [B, A];
    for (const s of ordem) {
      const m = await medir(K6, ['inspect', entradas[id][s]], ambienteLimpo());
      if (m.codigo === 0) { init.push({ s, id, r, ms: m.wallMs }); linhasInit.push(`${s},${id},${r},${f2(m.wallMs)}`); }
    }
  }
}
writeFileSync(join(SAIDA, 'inicializacao.csv'), linhasInit.join('\n') + '\n');

// C
const cab = 'suite,entrada,nivel,vus,iteracoes,rep,ordem,wall_ms,cpu_user_s,cpu_sys_s,rss_pico_kb,amostras,codigo,valida,checks_falhas,iteracoes_k6,http_reqs,dur_media_ms,dur_p95_ms';
const linhas = [cab];
const runs = [];
let feitas = 0; const idsDoNivel = (nv) => ids.filter((id) => nv.iter === 1 || !EXCLUIR_CARGA.has(id));
const total = REPS * NIVEIS.reduce((a, nv) => a + idsDoNivel(nv).length, 0) * 2;
for (let rep = 1; rep <= REPS; rep++) {
  for (const nv of NIVEIS) {
    for (const id of idsDoNivel(nv)) {
      const ordem = rep % 2 ? [A, B] : [B, A];
      for (const [pos, s] of ordem.entries()) {
        const api = await iniciarApi();
        const arq = join(mkdtempSync(join(tmpdir(), 'k6sum-')), 'sum.json');
        const m = await medir(K6, ['run', '--quiet', '--no-usage-report', '--vus', String(nv.vus), '--iterations', String(nv.iter), '--summary-export', arq, entradas[id][s]], ambienteLimpo());
        await pararApi(api);
        let sum = {}; try { sum = JSON.parse(readFileSync(arq, 'utf8')).metrics ?? {}; } catch { /* falha de execução */ }
        const falhas = sum.checks?.fails ?? NaN;
        const itK6 = sum.iterations?.count ?? NaN;
        const valida = m.codigo === 0 && falhas === 0 && itK6 === nv.iter;
        const row = { s, id, nv, rep, pos, m, valida, falhas, itK6, reqs: sum.http_reqs?.count ?? NaN, durMed: sum.http_req_duration?.avg ?? NaN, durP95: sum.http_req_duration?.['p(95)'] ?? NaN };
        runs.push(row);
        linhas.push([s, id, nv.rotulo, nv.vus, nv.iter, rep, pos + 1, f2(m.wallMs), m.cpuUser, m.cpuSys, m.rssKb, m.amostras, m.codigo, valida, falhas, itK6, row.reqs, f2(row.durMed), f2(row.durP95)].join(','));
        if (!valida) console.warn(`\n[inválida] ${s} ${id} ${nv.rotulo} rep${rep}: código ${m.codigo}, falhas de check ${falhas}, iterações ${itK6}/${nv.iter}`);
        process.stdout.write(`\r${++feitas}/${total} execuções`);
      }
    }
  }
}
process.stdout.write('\n');
writeFileSync(join(SAIDA, 'execucoes.csv'), linhas.join('\n') + '\n');

// ---------- D) resumo ----------
const por = (arr, f) => arr.reduce((acc, x) => { const k = f(x); (acc[k] ??= []).push(x); return acc; }, {});
const validas = runs.filter((r) => r.valida);
let md = `# Custo de execução — resumo\n\nGerado em ${new Date().toISOString()}. Ambiente em ambiente.json (hash das fontes ${amb.hashFontes.slice(0, 12)}…).\n\n`;
md += `Execuções: ${runs.length}; válidas: ${validas.length}; inválidas: ${runs.length - validas.length} (excluídas dos resumos).\n`;
md += `\nMétodo: mediana de ${REPS} repetições por célula; ordem ${A}/${B} alternada entre repetições; API reiniciada a cada execução; CPU e RSS por amostragem de /proc a cada 5 ms (o pico de RSS é VmHWM da última amostra; CPU tem resolução de ${1000 / TICKS} ms). Análise exploratória, sem testes inferenciais.\n`;

md += `\n## A. Código empacotado pelo k6 (por entrada)\n\n| Entrada | Módulos ${A} | Módulos ${B} | Bytes ${A} | Bytes ${B} | Razão bytes ${B}/${A} |\n|---|---:|---:|---:|---:|---:|\n`;
for (const id of ids) { const t = estaticas[id][A], m = estaticas[id][B]; md += `| ${id} | ${t.modulos} | ${m.modulos} | ${t.bytesCodigo} | ${m.bytesCodigo} | ${f2(m.bytesCodigo / t.bytesCodigo)} |\n`; }

const medInit = (s, id) => mediana(init.filter((x) => x.s === s && x.id === id).map((x) => x.ms));
md += `\n## B. Inicialização (k6 inspect, mediana em ms)\n\n| Entrada | ${A} | ${B} | Razão ${B}/${A} |\n|---|---:|---:|---:|\n`;
const razInit = [];
for (const id of ids) { const t = medInit(A, id), m = medInit(B, id); razInit.push(m / t); md += `| ${id} | ${f2(t)} | ${f2(m)} | ${f2(m / t)} |\n`; }
md += `\nMediana das razões ${B}/${A} entre entradas: **${f2(mediana(razInit))}** (mín ${f2(Math.min(...razInit))}, máx ${f2(Math.max(...razInit))}).\n`;

for (const nv of NIVEIS) {
  md += `\n## C. Carga ${nv.rotulo} (${nv.vus} VUs, ${nv.iter} iterações) — mediana [Q1–Q3]\n\n| Entrada | Tempo ${A} (ms) | Tempo ${B} (ms) | CPU ${A} (s) | CPU ${B} (s) | RSS pico ${A} (MB) | RSS pico ${B} (MB) |\n|---|---:|---:|---:|---:|---:|---:|\n`;
  const rz = { tempo: [], cpu: [], rss: [] };
  for (const id of idsDoNivel(nv)) {
    const cel = (s) => validas.filter((r) => r.s === s && r.id === id && r.nv.rotulo === nv.rotulo);
    const T = cel(A), M = cel(B);
    const est = (xs, f) => { const v = xs.map(f); return `${f2(mediana(v))} [${f2(quantil(v, 0.25))}–${f2(quantil(v, 0.75))}]`; };
    const tempo = (r) => r.m.wallMs, cpu = (r) => r.m.cpuUser + r.m.cpuSys, rss = (r) => r.m.rssKb / 1024;
    md += `| ${id} | ${est(T, tempo)} | ${est(M, tempo)} | ${est(T, cpu)} | ${est(M, cpu)} | ${est(T, rss)} | ${est(M, rss)} |\n`;
    rz.tempo.push(mediana(M.map(tempo)) / mediana(T.map(tempo)));
    rz.cpu.push(mediana(M.map(cpu)) / mediana(T.map(cpu)));
    rz.rss.push(mediana(M.map(rss)) / mediana(T.map(rss)));
  }
  const lin = (n, a) => `- ${n}: mediana ${f2(mediana(a))} (mín ${f2(Math.min(...a))}, máx ${f2(Math.max(...a))})`;
  md += `\nRazões ${B}/${A} entre entradas:\n${lin('tempo', rz.tempo)}\n${lin('CPU', rz.cpu)}\n${lin('RSS de pico', rz.rss)}\n`;
}

// Memória incremental por VU entre o menor e o maior nível
if (NIVEIS.length > 1) {
  const lo = NIVEIS[0], hi = NIVEIS[NIVEIS.length - 1];
  md += `\n## D. Memória incremental por VU (${lo.rotulo} → ${hi.rotulo}), em MB/VU\n\n| Entrada | ${A} | ${B} |\n|---|---:|---:|\n`;
  const acc = { [A]: [], [B]: [] };
  for (const id of idsDoNivel(hi)) {
    const v = (s) => {
      const g = (n) => mediana(validas.filter((r) => r.s === s && r.id === id && r.nv.rotulo === n.rotulo).map((r) => r.m.rssKb / 1024));
      return (g(hi) - g(lo)) / (hi.vus - lo.vus);
    };
    const t = v(A), m = v(B); acc[A].push(t); acc[B].push(m);
    md += `| ${id} | ${f2(t)} | ${f2(m)} |\n`;
  }
  md += `\nMediana entre entradas: ${A} ${f2(mediana(acc[A]))}; ${B} ${f2(mediana(acc[B]))}.\n`;
}

md += `\n## Limitações\n\n- Entradas excluídas dos níveis com mais de 1 iteração: ${[...EXCLUIR_CARGA].join(', ') || 'nenhuma'}. O CT-11 verifica que a listagem de pedidos \`created\` tem exatamente um item, o que só vale com a API em estado vazio (1 iteração); nas duas suítes ele falha em todas as iterações extras. Isso decorre do oráculo do CT-11, não da arquitetura.\n- Com \`--vus\`/\`--iterations\` na linha de comando, o k6 ignora a configuração de \`scenarios\` das entradas modulares (aviso "overrode scenarios"). A camada Profile fica fora da execução sob carga, mas todos os módulos continuam carregados e executados; as suítes não foram alteradas.\n- Os níveis de carga apenas escalam o mesmo trabalho; não representam tráfego real. A API roda na mesma máquina e compete por CPU.\n- Uma máquina, um sistema operacional, ${REPS} repetições por célula: resultados descritivos, sem generalização.\n`;
writeFileSync(join(SAIDA, 'resumo.md'), md);
console.log(`Resumo em ${join(SAIDA, 'resumo.md')}`);
