// Sonda HTTP de infraestrutura. Não é cenário k6 nem implementação de uma arquitetura.
import fs from 'node:fs';
import path from 'node:path';
import {SCENARIOS,validateHttp} from './oraculos.mjs';
import {write,lines,startObservedApi} from './execucao.mjs';
const out=path.resolve(process.argv[2]||'evidencias/preparacao_e1/oraculo-'+new Date().toISOString().replace(/[:.]/g,'-'));
if(fs.existsSync(out))throw Error('Usar pasta de evidência nova');
fs.mkdirSync(out,{recursive:true});
const results=[];
for(const id of ['ct06','ct07']){
 const folder=path.join(out,id);fs.mkdirSync(folder);
 const api=await startObservedApi(folder);let token=null;const responses=[];
 try{
  if(!api.ready)throw Error('API não ficou pronta');
  for(const step of SCENARIOS[id].steps){
   const response=await fetch(api.baseUrl+step.path,{method:step.method,
    headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},
    body:step.payload===undefined?undefined:JSON.stringify(step.payload),signal:AbortSignal.timeout(3000)});
   const text=await response.text();responses.push({status:response.status,body:text});
   if(step.kind==='login')token=JSON.parse(text).token;
  }
 }finally{await api.stop();}
 const received=lines(path.join(folder,'server-requests.jsonl'));
 const verdict=validateHttp(id,received,{host:new URL(api.baseUrl).host,client:'node-contract-probe'});
 const result={id,passed:verdict.passed,verdict,received_requests:received.length,
  k6_scenario_executed:false,k6_checks_verified:false,vu_iteration_verified:false,
  note:'A sonda verifica o contrato HTTP contra o oráculo; checks/VUs/iterações das futuras suítes permanecem não executados.'};
 write(path.join(folder,'client-responses.json'),responses);write(path.join(folder,'result.json'),result);
 results.push(result);
}
const passed=results.every(r=>r.passed);
write(path.join(out,'result.json'),{passed,results,scope:'infraestrutura comum, sem esforço experimental ou cenários k6'});
console.log(JSON.stringify({passed,results},null,2));process.exitCode=passed?0:1;
