import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.resolve(process.argv[2]||'evidencias/prontidao/auditoria');
fs.mkdirSync(out,{recursive:true});
const git=(...args)=>{const r=spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const e0='e93c3fcf8e954dc1a1e8a05d621c9f23b8ccdc87';
assert.equal(git('rev-parse','e0-baseline-validada^{commit}'),e0);
assert.equal(git('cat-file','-t','refs/tags/e0-baseline-validada'),'tag');
const source=json('evidencias/validacao_final/2026-11-05T17-07-25-732Z/source-manifest-before.json');

const preservation=json('historico/validacao-e0/MANIFESTO_PRESERVACAO.json');
const paths=[...Object.keys(source),...preservation.files.flatMap(f=>[f.source,f.archived_path])];
const batch=spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'cat-file','--batch'],{cwd:root,windowsHide:true,input:paths.map(p=>e0+':'+p).join('\n')+'\n',maxBuffer:16*1024*1024});
assert.equal(batch.status,0);const committedFiles=new Map();let offset=0;
for(const p of paths){const newline=batch.stdout.indexOf(10,offset);assert.ok(newline>=0);const header=batch.stdout.subarray(offset,newline).toString('utf8');const match=header.match(/^[0-9a-f]+ blob (\d+)$/);assert.ok(match,header);const size=Number(match[1]);offset=newline+1;committedFiles.set(p,batch.stdout.subarray(offset,offset+size));offset+=size+1;}
const sourceResults=[];
for(const [p,expected] of Object.entries(source)){
  const current=hash(fs.readFileSync(path.join(root,p)));
  const r=spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show',e0+':'+p],{cwd:root,windowsHide:true});
  assert.equal(r.status,0);
  const committed=hash(r.stdout);
  assert.equal(current,expected,p);assert.equal(committed,expected,p);
  sourceResults.push({path:p,sha256:expected,working_and_tag_match:true});
}
for(const f of preservation.files){
  for(const p of [f.source,f.archived_path]){
    assert.equal(hash(fs.readFileSync(path.join(root,p))),f.sha256,p);
    assert.equal(hash(committedFiles.get(p)),f.sha256,p+' na tag');
  }
}
const matrix=fs.readFileSync(path.join(root,'MATRIZ_REQUISITOS_EXPANSAO.md'),'utf8');
const baseline=[...matrix.matchAll(/^\| CT-(0[1-5]) \|[^\n]+?\| (\d+) \| (\d+) \|$/gm)].map(m=>({id:Number(m[1]),requests:Number(m[2]),checks:Number(m[3])}));
assert.equal(baseline.length,5);
const scenarios=[...baseline];
const sections=[...matrix.matchAll(/^### CT-(\d{2})[^\n]*\n([\s\S]*?)(?=^### CT-|^## |$(?![\s\S]))/gm)];
for(const m of sections){
  const operations=[...m[2].matchAll(/^\| (\d{2})(?:–(\d{2}))? \|/gm)];
  let next=1;
  for(const op of operations){assert.equal(Number(op[1]),next,'operação fora da sequência CT-'+m[1]);next=Number(op[2]||op[1])+1;}
  const acceptance=m[2].match(/Aceitação: \*\*(\d+) requests, (\d+) checks\*\*/);
  assert.ok(acceptance,'Aceitação ausente CT-'+m[1]);
  assert.equal(Number(acceptance[1]),next-1);
  assert.equal(Number(acceptance[2]),2*(next-1));
  scenarios.push({id:Number(m[1]),requests:next-1,checks:2*(next-1)});
}
assert.equal(scenarios.length,15);
assert.deepEqual(scenarios.map(x=>x.id),Array.from({length:15},(_,i)=>i+1));
const totalsRows=[...matrix.matchAll(/^\| (E[0-4]) \| CT-[^|]+\| ([^|]+) \| ([^|]+) \| (\d+) \| (\d+) \|$/gm)];
assert.equal(totalsRows.length,5);
const boundaries=[5,7,10,12,15], totals=[];
for(const [i,m] of totalsRows.entries()){
  const cumulative=scenarios.slice(0,boundaries[i]);
  const added=i?scenarios.slice(boundaries[i-1],boundaries[i]):[];
  const requests=cumulative.reduce((n,x)=>n+x.requests,0),checks=cumulative.reduce((n,x)=>n+x.checks,0);
  assert.equal(Number(m[4]),requests);assert.equal(Number(m[5]),checks);
  if(i){assert.equal(Number(m[2].trim()),added.reduce((n,x)=>n+x.requests,0));assert.equal(Number(m[3].trim()),added.reduce((n,x)=>n+x.checks,0));}
  totals.push({state:m[1],scenarios_per_suite:boundaries[i],executions_two_suites:2*boundaries[i],requests_per_suite:requests,checks_per_suite:checks,requests_two_suites:2*requests,checks_two_suites:2*checks});
}
const historical=json('evidencias/validacao_final/2026-11-05T17-07-25-732Z/result.json');
assert.equal(historical.complete_functional_equivalence,true);assert.equal(historical.architecture_preserved,true);
for(const [i,pair]of historical.pairs.entries()){
  assert.equal(pair.equivalent,true);
  for(const run of pair.runs){assert.equal(run.real_success,true);assert.equal(run.received_requests,baseline[i].requests);assert.equal(run.passed_checks,baseline[i].checks);assert.equal(run.iterations,1);assert.equal(run.profile_valid,true);}
}
assert.equal(git('diff',e0,'--','api/','modular/','tradicional/','shared/','tests/','scripts/validacao/','RELATORIO_VALIDACAO_FINAL.md','historico/','evidencias/validacao_final/'),'');
const protectedFiles=git('ls-tree','-r','--name-only',e0,'--','modular/').split('\n');
assert.equal(protectedFiles.length,24);
assert.ok(protectedFiles.includes('modular/helpers/http/http.js'));assert.ok(protectedFiles.includes('modular/helpers/checks/checks.js'));
const report={captured_utc:new Date().toISOString(),e0_commit:e0,e0_tag:'e0-baseline-validada',annotated_tag_verified:true,
  sources_checked:sourceResults,modular_file_count:protectedFiles.length,archived_files_checked:preservation.files.length,
  archive_working_and_e0_tag_verified:true,historical_functional_success_verified:true,baseline_protected_paths_unchanged:true,
  acceptance_arithmetic_verified:true,scenarios,totals,expanded_scenarios_implemented:false,definitive_measurements_started:false};
fs.writeFileSync(path.join(out,'auditoria-e0-matriz.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ok:true,e0_commit:e0,modular_files:protectedFiles.length,archive_files:preservation.files.length,totals},null,2));
