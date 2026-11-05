// Infraestrutura comum: valida E0 e entradas futuras E1; não implementa cenários.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {SCENARIOS,E0_IDS,E1_IDS,validateRun,canonicalTrace,stable} from './oraculos.mjs';
import {ROOT,write,lines,command,cleanK6Environment,startObservedApi} from './execucao.mjs';
const args=process.argv.slice(2);
const arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const state=arg('--state','E0'),suite=arg('--suite','both');
const out=path.resolve(arg('--out',path.join(ROOT,'evidencias/preparacao_e1','regressao-'+new Date().toISOString().replace(/[:.]/g,'-'))));
if(fs.existsSync(out))throw Error('Pasta de evidência já existe; usar destino novo');
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(){
 const files={};
 function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);if(e.isDirectory()&&e.name!=='__pycache__')walk(p);
  else if(/\.(?:m?js|py)$/.test(e.name))files[path.relative(ROOT,p).replaceAll('\\','/')]=hash(fs.readFileSync(p));
 }}
 for(const d of ['tradicional','modular','api','shared','scripts/validacao'])walk(path.join(ROOT,d));
 return files;
}
const before=inventory();write(path.join(out,'source-manifest-before.json'),before);
const groups=suite==='both'?['tradicional','modular']:[suite];
const ids=state==='E0'?E0_IDS:E1_IDS;
const env=cleanK6Environment();
const versions={};
for(const [name,cmd]of Object.entries({node:['node','--version'],k6:['k6','version'],npm:['cmd.exe','/d','/c','npm.cmd --version'],git:['git','-c','safe.directory='+ROOT.replaceAll('\\','/'),'rev-parse','HEAD']}))versions[name]=command(cmd,out,name,{env});
write(path.join(out,'environment.json'),{utc:new Date().toISOString(),platform:os.platform(),release:os.release(),arch:os.arch(),tools:versions,
 k6_environment_options_removed:Object.keys(process.env).filter(k=>/^K6_/i.test(k))});
let entries;
try{
 if(!['E0','E1'].includes(state)||!groups.every(g=>['tradicional','modular'].includes(g)))throw Error('Estado/arquitetura inválidos');
 if(args.includes('--manifest'))entries=JSON.parse(fs.readFileSync(path.resolve(arg('--manifest')),'utf8'));
 else if(state==='E0')entries=groups.flatMap(group=>E0_IDS.map(id=>({id,suite:group,script:group==='tradicional'?'tradicional/'+id+'.js':'modular/scenarios/'+SCENARIOS[id].journey+'.scenario.js'})));
 else throw Error('E1 exige --manifest com os caminhos dos cenários reais; o validador não cria entradas CT-06/07');
 if(!Array.isArray(entries))throw Error('Manifesto deve ser array');
 entries=entries.filter(e=>groups.includes(e.suite));
 const expected=groups.flatMap(g=>ids.map(id=>g+':'+id)).sort();
 const actual=entries.map(e=>e.suite+':'+e.id).sort();
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Manifesto deve conter exatamente uma entrada por ID/arquitetura do estado');
 for(const e of entries){
  const absolute=path.resolve(ROOT,e.script),base=path.resolve(ROOT,e.suite)+path.sep;
  if(!absolute.startsWith(base)||!fs.existsSync(absolute)||!fs.realpathSync(absolute).startsWith(fs.realpathSync(path.resolve(ROOT,e.suite))+path.sep))throw Error('Script ausente ou fora da suíte: '+e.script);
 }
 write(path.join(out,'entries.json'),entries);
}catch(error){
 write(path.join(out,'result.json'),{state,suite,preflight_passed:false,validation_passed:false,complete_functional_equivalence:false,error:error.message});
 console.error(error.message);process.exit(1);
}
const modular=Object.keys(before).filter(p=>p.startsWith('modular/'));
write(path.join(out,'code-accounting.json'),{included_in_modular_code_metrics:modular,actual_file_count:modular.length,
 http_helper_included:modular.includes('modular/helpers/http/http.js'),checks_helper_included:modular.includes('modular/helpers/checks/checks.js'),
 note:'Inventário integral, sem coleta de esforço, LOC ou duplicação.'});
write(path.join(out,'oracle-provenance.json'),{frozen_protocol_commit:'92c3bff5a6b0c7837aa97729fdc56bdf11976007',
 matrix_path_in_frozen_commit:'MATRIZ_REQUISITOS_EXPANSAO.md',oracle_sha256:hash(fs.readFileSync(path.join(ROOT,'scripts/validacao/oraculos.mjs')))});
const runs=[];
for(const entry of entries){
 const {id,suite:group,script}=entry;
 const folder=path.join(out,group+'_'+id);fs.mkdirSync(folder);
 const inspect=command(['k6','inspect',script],folder,'inspect',{env});
 let options={};try{options=JSON.parse(inspect.stdout)}catch{}
 write(path.join(folder,'effective-options.json'),options);
 const api=await startObservedApi(folder);
 let run={exit_code:null};
 try{
  if(api.ready)run=command(['k6','run','--no-usage-report','--no-color','--quiet','--log-format=json','--log-output','file='+path.join(folder,'http-debug.jsonl'),'--http-debug=full',
   '--summary-export',path.join(folder,'summary.json'),'--out','json='+path.join(folder,'metrics.jsonl'),'-e','BASE_URL='+api.baseUrl,script],folder,'k6-run',{env});
 }finally{await api.stop();}
 const received=lines(path.join(folder,'server-requests.jsonl'));
 const points=lines(path.join(folder,'metrics.jsonl')).filter(m=>m.type==='Point');
 const checks=points.filter(m=>m.metric==='checks').map(m=>({name:m.data.tags?.check,value:m.data.value,time:m.data.time}));
 const sum=metric=>points.filter(m=>m.metric===metric).reduce((n,m)=>n+m.data.value,0);
 const metrics={iterations:sum('iterations'),http_reqs:sum('http_reqs'),http_req_failed:sum('http_req_failed')};
 const verdict=validateRun(id,{received,checks,options,suite:group,scenarioKey:entry.scenarioKey||id,metrics,exitCode:run.exit_code,inspectionExit:inspect.exit_code,apiReady:api.ready,host:api.baseUrl?new URL(api.baseUrl).host:null});
 const result={scenario:id,suite:group,script,exit_code:run.exit_code,api_ready:api.ready,received_requests:received.length,
  passed_checks:checks.filter(c=>c.value===1).length,observed_checks:checks.length,metrics,real_success:verdict.passed,oracle:verdict};
 write(path.join(folder,'checks.json'),checks);write(path.join(folder,'result.json'),result);
 runs.push({result,received,checks});console.log(group+' '+id+': '+verdict.passed);
}
const comparisons=[];
if(suite==='both')for(const id of ids){
 const pair=runs.filter(r=>r.result.scenario===id);
 const success=pair.length===2&&pair.every(r=>r.result.real_success);
 const requests_equal=success?JSON.stringify(canonicalTrace(pair[0].received))===JSON.stringify(canonicalTrace(pair[1].received)):null;
 const checks_equal=success?JSON.stringify(stable(pair[0].checks.map(({name,value})=>({name,value}))))===JSON.stringify(stable(pair[1].checks.map(({name,value})=>({name,value})))):null;
 const comparison={scenario:id,requests_responses_equal:requests_equal,checks_equal,equivalent:success&&requests_equal&&checks_equal};
 comparisons.push(comparison);write(path.join(out,id+'-comparison.json'),comparison);
}
const after=inventory();write(path.join(out,'source-manifest-after.json'),after);
const preserved=JSON.stringify(stable(before))===JSON.stringify(stable(after));
const complete=suite==='both'&&comparisons.every(c=>c.equivalent);
const passed=preserved&&runs.every(r=>r.result.real_success)&&(suite!=='both'||complete);
write(path.join(out,'result.json'),{state,suite,preflight_passed:true,validation_passed:passed,complete_functional_equivalence:passed&&complete,
 architecture_preserved:preserved,runs:runs.map(r=>r.result),comparisons,
 totals:{executions:runs.length,received_requests:runs.reduce((n,r)=>n+r.result.received_requests,0),passed_checks:runs.reduce((n,r)=>n+r.result.passed_checks,0)}});
console.log('EVIDENCIAS='+out);process.exitCode=passed?0:1;
