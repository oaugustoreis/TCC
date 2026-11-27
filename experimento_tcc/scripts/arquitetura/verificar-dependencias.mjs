// Extrai o grafo de imports das suítes e verifica a regra de dependência entre camadas.
// Uso: node scripts/arquitetura/verificar-dependencias.mjs [--json saida.json]
// Sai com código 1 se houver violação. Somente análise estática (não executa k6).
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Camada de um arquivo, a partir do caminho relativo à raiz do experimento.
function camada(rel) {
  const p = rel.split(sep).join('/');
  if (p.startsWith('modular/scenarios/')) return 'Scenario';
  if (p.startsWith('modular/profiles/')) return 'Profile';
  if (p.startsWith('modular/flows/')) return 'Flow';
  if (p.startsWith('modular/use-cases/')) return 'UseCase';
  if (p.startsWith('modular/helpers/')) return 'Helper';
  if (p.startsWith('shared/')) return 'Shared';
  if (p.startsWith('tradicional/')) return 'Tradicional';
  return 'Outro';
}

// Regra declarada: quem pode importar quem. 'k6' = módulos nativos (k6/http, k6 etc.).
const PERMITIDO = {
  Scenario: ['Profile', 'Flow', 'Shared', 'k6'],
  Profile: ['Profile', 'Shared', 'k6'], // Profile -> Profile apenas para o perfil comum (smoke); Shared fornece OPTIONS
  Flow: ['UseCase', 'k6'],
  UseCase: ['Helper', 'k6'],
  Helper: ['k6'],
  Tradicional: ['Shared', 'k6'],
  Shared: ['k6'],
};

function listar(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) listar(p, acc);
    else if (p.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const RE = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g;
const arquivos = ['modular', 'tradicional', 'shared'].flatMap((d) => listar(join(RAIZ, d)));

const arestas = [];
for (const arq of arquivos) {
  const src = readFileSync(arq, 'utf8');
  const origem = relative(RAIZ, arq);
  for (const m of src.matchAll(RE)) {
    const alvo = m[1];
    let destino;
    if (alvo.startsWith('.')) destino = camada(relative(RAIZ, resolve(dirname(arq), alvo)));
    else destino = 'k6';
    arestas.push({ de: origem.split(sep).join('/'), camadaDe: camada(origem), para: alvo, camadaPara: destino });
  }
}

const matriz = {};
for (const a of arestas) {
  matriz[a.camadaDe] ??= {};
  matriz[a.camadaDe][a.camadaPara] = (matriz[a.camadaDe][a.camadaPara] ?? 0) + 1;
}

const violacoes = arestas.filter((a) => !(PERMITIDO[a.camadaDe] ?? []).includes(a.camadaPara));
// Profile -> Profile só é válido quando o alvo é modular/profiles/comum/
const violProfile = arestas.filter((a) => a.camadaDe === 'Profile' && a.camadaPara === 'Profile' && !a.para.includes('/comum/'));
violacoes.push(...violProfile);

// Ciclos entre arquivos modulares (DFS).
const grafo = new Map();
for (const a of arestas.filter((x) => x.para.startsWith('.'))) {
  const alvo = relative(RAIZ, resolve(dirname(join(RAIZ, a.de)), a.para)).split(sep).join('/');
  grafo.set(a.de, [...(grafo.get(a.de) ?? []), alvo]);
}
const ciclos = [];
const estado = new Map();
function dfs(n, pilha) {
  estado.set(n, 1);
  for (const v of grafo.get(n) ?? []) {
    if (estado.get(v) === 1) ciclos.push([...pilha, n, v]);
    else if (!estado.get(v)) dfs(v, [...pilha, n]);
  }
  estado.set(n, 2);
}
for (const n of grafo.keys()) if (!estado.get(n)) dfs(n, []);

const contagem = {};
for (const arq of arquivos) { const c = camada(relative(RAIZ, arq)); contagem[c] = (contagem[c] ?? 0) + 1; }

const saida = { arquivos: contagem, importacoes: arestas.length, matriz, violacoes, ciclos };
const i = process.argv.indexOf('--json');
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(saida, null, 2));

console.log('Arquivos por camada:', JSON.stringify(contagem));
console.log('Importações analisadas:', arestas.length);
console.log('Matriz (linha importa coluna):');
console.log(JSON.stringify(matriz, null, 2));
console.log('Violações da regra:', violacoes.length);
for (const v of violacoes) console.log(' -', v.de, '->', v.para, `(${v.camadaDe} -> ${v.camadaPara})`);
console.log('Ciclos:', ciclos.length);
process.exit(violacoes.length || ciclos.length ? 1 : 0);
