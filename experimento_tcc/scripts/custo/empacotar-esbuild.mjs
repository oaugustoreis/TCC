#!/usr/bin/env node
// Gera uma versão empacotada (um único módulo por entrada, k6 e k6/* como externos) de cada suíte,
// em build-esbuild/<suite>/ctNN.js, para medir o custo de execução com bundling.
// Requer esbuild:  npm install --no-save esbuild   (ou ESBUILD_DIR=/caminho/node_modules/..)
// Uso: node scripts/custo/empacotar-esbuild.mjs [--minify]
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync, rmSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const req = createRequire(import.meta.url);
const esbuild = req(req.resolve('esbuild', { paths: [RAIZ, process.cwd(), process.env.ESBUILD_DIR].filter(Boolean) }));
const listar = (d, a = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? listar(p, a) : a.push(p); } return a; };
const entradas = {
  tradicional: Object.fromEntries(listar(join(RAIZ, 'tradicional')).map((f) => [f.match(/(ct\d\d)\.js$/)?.[1], f]).filter(([k]) => k)),
  intermediaria: Object.fromEntries(listar(join(RAIZ, 'intermediaria')).filter((f) => !f.includes('/lib/')).map((f) => [f.match(/(ct\d\d)\.js$/)?.[1], f]).filter(([k]) => k)),
  modular: Object.fromEntries(listar(join(RAIZ, 'modular', 'scenarios')).map((f) => [readFileSync(f, 'utf8').match(/scenarios:\s*\{\s*(ct\d\d)/)?.[1], f]).filter(([k]) => k)),
};
rmSync(join(RAIZ, 'build-esbuild'), { recursive: true, force: true });
const minify = process.argv.includes('--minify');
for (const [suite, es] of Object.entries(entradas)) {
  if (!Object.keys(es).length) continue;
  mkdirSync(join(RAIZ, 'build-esbuild', suite), { recursive: true });
  for (const [id, f] of Object.entries(es)) {
    await esbuild.build({ entryPoints: [f], bundle: true, format: 'esm', platform: 'neutral', target: 'es2020', external: ['k6', 'k6/*'], minify, outfile: join(RAIZ, 'build-esbuild', suite, `${id}.js`), logLevel: 'warning' });
  }
  console.log(`${suite}: ${Object.keys(es).length} entradas empacotadas`);
}
