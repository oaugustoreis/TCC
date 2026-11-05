import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRun,validateHttp} from './oraculos.mjs';

// Fixtures sintéticas para testar REJEIÇÃO do validador, não resultados das suítes.
function fixture(id='ct06'){
 const host='127.0.0.1:12345';
 const auth={host,'user-agent':'Grafana k6/test','content-type':'application/json',authorization:'Bearer token-experimental'};
 const payload='{"username":"pesquisador","password":"teste123"}';
 const received=[{sequence:1,method:'POST',path:'/auth/login',headers:{host,'user-agent':'Grafana k6/test','content-type':'application/json','content-length':String(Buffer.byteLength(payload))},
  payload,status:200,responseHeaders:{'content-type':'application/json'},responseBody:'{"token":"token-experimental","tokenType":"Bearer"}'}];
 if(id==='ct06'){
  received.push({sequence:2,method:'GET',path:'/products?category=principal',headers:{...auth},payload:'',status:200,responseHeaders:{'content-type':'application/json'},responseBody:'{"items":[{"id":"p1","name":"Produto A","price":100,"category":"principal"}]}'});
  received.push({sequence:3,method:'GET',path:'/products/p1',headers:{...auth},payload:'',status:200,responseHeaders:{'content-type':'application/json'},responseBody:'{"id":"p1","name":"Produto A","price":100,"category":"principal"}'});
 }else{
  for(const [i,productId]of ['p1','p2'].entries())received.push({sequence:i+2,method:'GET',path:'/products/'+productId+'/stock',headers:{...auth},payload:'',status:200,responseHeaders:{'content-type':'application/json'},responseBody:JSON.stringify({productId,quantity:productId==='p1'?10:0,available:productId==='p1'})});
 }
 const label=id==='ct06'?'CT-06':'CT-07';
 return {received,checks:[label+' 01 status',label+' 01 corpo',label+' 02 status',label+' 02 corpo',label+' 03 status',label+' 03 corpo'].map(name=>({name,value:1})),
  options:{vus:1,iterations:1,thresholds:{checks:['rate==1']}},suite:'tradicional',
  metrics:{iterations:1,http_reqs:3,http_req_failed:0},exitCode:0,inspectionExit:0,apiReady:true,host};
}
for(const id of ['ct06','ct07'])test('oráculo aceita fixture sintética conforme '+id,()=>assert.equal(validateRun(id,fixture(id)).passed,true));
const mutations=[
 ['ordem de requisições',x=>{[x.received[1],x.received[2]]=[x.received[2],x.received[1]]}],
 ['método',x=>x.received[1].method='POST'],
 ['rota',x=>x.received[2].path='/products/p2'],
 ['query ausente',x=>x.received[1].path='/products'],
 ['query extra',x=>x.received[1].path+='&naoPrevisto=1'],
 ['Authorization incorreta',x=>x.received[1].headers.authorization='Bearer errado'],
 ['Host',x=>x.received[1].headers.host='outro:1'],
 ['Content-Type request',x=>x.received[1].headers['content-type']='text/plain'],
 ['payload de login',x=>x.received[0].payload='{"username":"outro","password":"teste123"}'],
 ['body inesperado em GET',x=>x.received[1].payload='{}'],
 ['status',x=>x.received[1].status=500],
 ['categoria obrigatória',x=>x.received[2].responseBody='{"id":"p1","name":"Produto A","price":100}'],
 ['filtro errado com dois produtos',x=>x.received[1].responseBody='{"items":[{"id":"p1","name":"Produto A","price":100,"category":"principal"},{"id":"p2"}]}'],
 ['JSON inválido',x=>x.received[1].responseBody='{'],
 ['corpo null',x=>x.received[1].responseBody='null'],
 ['check faltante',x=>x.checks.pop()],
 ['label errado',x=>x.checks[0].name='outro label'],
 ['ordem de checks',x=>x.checks.reverse()],
 ['check reprovado',x=>x.checks[0].value=0],
 ['VUs',x=>x.options.vus=2],
 ['iterações configuradas',x=>x.options.iterations=2],
 ['iterações concluídas',x=>x.metrics.iterations=0],
 ['http_reqs',x=>x.metrics.http_reqs=2],
 ['falha HTTP',x=>x.metrics.http_req_failed=1],
 ['k6 com saída não zero',x=>x.exitCode=99],
 ['API não pronta',x=>x.apiReady=false]
];
for(const [name,mutate]of mutations)test('oráculo rejeita '+name,()=>{
 const input=fixture();mutate(input);assert.equal(validateRun('ct06',input).passed,false);
});
test('oráculo de estoque exige tipos e valores exatos',()=>{
 const x=fixture('ct07');x.received[2].responseBody='{"productId":"p2","quantity":"0","available":true}';
 assert.equal(validateHttp('ct07',x.received,{host:x.host}).passed,false);
});
test('profile modular aceita apenas shared-iterations com 1 VU/iteração',()=>{
 const x=fixture();x.suite='modular';x.options={scenarios:{ct06:{executor:'shared-iterations',vus:1,iterations:1}},thresholds:{checks:['rate==1']}};
 assert.equal(validateRun('ct06',x).passed,true);
 x.options.scenarios.ct06.executor='constant-vus';assert.equal(validateRun('ct06',x).passed,false);
});
