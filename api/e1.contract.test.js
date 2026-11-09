import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from './server.js';

// Infraestrutura comum; nenhum cenário k6 ou componente de uma arquitetura.
async function fixture(name, work) {
  const server=createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base='http://127.0.0.1:'+server.address().port;
  let sequence=0;
  async function request(route,{method='GET',body,token}={}) {
    const headers={'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})};
    const payload=body===undefined?undefined:JSON.stringify(body);
    const response=await fetch(base+route,{method,headers,body:payload,signal:AbortSignal.timeout(3000)});
    const raw=await response.text();
    if(process.env.E1_CONTRACT_TRACE_DIR){
      fs.mkdirSync(process.env.E1_CONTRACT_TRACE_DIR,{recursive:true});
      fs.appendFileSync(path.join(process.env.E1_CONTRACT_TRACE_DIR,name+'.jsonl'),JSON.stringify({
        sequence:++sequence,method,path:route,headers,payload:payload??'',status:response.status,
        responseHeaders:Object.fromEntries(response.headers),responseBody:raw
      })+'\n');
    }
    assert.match(response.headers.get('content-type'),/^application\/json/);
    return {status:response.status,body:JSON.parse(raw)};
  }
  async function login(){
    const r=await request('/auth/login',{method:'POST',body:{username:'pesquisador',password:'teste123'}});
    assert.equal(r.status,200);assert.deepEqual(r.body,{token:'token-experimental',tokenType:'Bearer'});return r.body.token;
  }
  try{await work({request,login});}finally{await new Promise(resolve=>server.close(resolve));}
}
const p1={id:'p1',name:'Produto A',price:100,category:'principal'};
const p2={id:'p2',name:'Produto B',price:50,category:'acessorio'};
test('E1: filtro de categoria ocorre na API e preserva catálogo sem filtro',()=>fixture('catalogo',async({request,login})=>{
  const token=await login();
  for(const [route,items] of [['/products',[p1,p2]],['/products?category=principal',[p1]],['/products?category=acessorio',[p2]],['/products?category=inexistente',[]]]){
    const r=await request(route,{token});assert.equal(r.status,200);assert.deepEqual(r.body,{items});
  }
}));
test('E1: consulta individual preserva IDs, nomes e preços e acrescenta categoria',()=>fixture('produto',async({request,login})=>{
  const token=await login();
  for(const product of [p1,p2]){const r=await request('/products/'+product.id,{token});assert.equal(r.status,200);assert.deepEqual(r.body,product);}
}));
test('E1: estoque positivo determinístico',()=>fixture('estoque-positivo',async({request,login})=>{
  const r=await request('/products/p1/stock',{token:await login()});
  assert.equal(r.status,200);assert.deepEqual(r.body,{productId:'p1',quantity:10,available:true});
}));
test('E1: estoque zero é indisponível com HTTP 200',()=>fixture('estoque-zero',async({request,login})=>{
  const r=await request('/products/p2/stock',{token:await login()});
  assert.equal(r.status,200);assert.deepEqual(r.body,{productId:'p2',quantity:0,available:false});
}));
test('E1: catálogo e estoque exigem Bearer válido',()=>fixture('autenticacao',async({request})=>{
  const routes=['/products','/products?category=principal','/products/p1','/products/p2','/products/p1/stock','/products/p2/stock','/products/inexistente/stock'];
  for(const route of routes)for(const token of [undefined,'invalido']){
    const r=await request(route,{token});assert.equal(r.status,401);assert.deepEqual(r.body,{error:'Não autorizado'});
  }
}));
test('E1: produtos inexistentes retornam 404 nas duas consultas',()=>fixture('inexistentes',async({request,login})=>{
  const token=await login();
  for(const route of ['/products/inexistente','/products/inexistente/stock']){
    const r=await request(route,{token});assert.equal(r.status,404);assert.deepEqual(r.body,{error:'Produto não encontrado'});
  }
}));
test('E0: saúde, credenciais, criação, consulta, confirmação e erros anteriores preservados',()=>fixture('baseline',async({request,login})=>{
  assert.deepEqual(await request('/health'),{status:200,body:{status:'ok'}});
  assert.deepEqual(await request('/auth/login',{method:'POST',body:{username:'incorreto',password:'incorreto'}}),{status:401,body:{error:'Credenciais inválidas'}});
  const token=await login();
  assert.equal((await request('/orders',{method:'POST',body:{productId:'p1',quantity:0},token})).status,400);
  assert.equal((await request('/orders/o999999',{token})).status,404);
  const created=await request('/orders',{method:'POST',body:{productId:'p1',quantity:1},token});
  assert.equal(created.status,201);assert.match(created.body.id,/^o\d+$/);
  const order={id:created.body.id,productId:'p1',quantity:1,status:'created'};
  assert.deepEqual(created.body,order);
  assert.deepEqual(await request('/orders/'+order.id,{token}),{status:200,body:order});
  assert.equal((await request('/orders/'+order.id+'/status',{method:'PATCH',body:{status:'invalido'},token})).status,400);
  const confirmed={...order,status:'confirmed'};
  assert.deepEqual(await request('/orders/'+order.id+'/status',{method:'PATCH',body:{status:'confirmed'},token}),{status:200,body:confirmed});
  assert.deepEqual(await request('/orders/'+order.id,{token}),{status:200,body:confirmed});
}));
test('E1: estoque é informativo e não sofre reserva ou baixa após pedido',()=>fixture('estoque-informativo',async({request,login})=>{
  const token=await login();const before=await request('/products/p1/stock',{token});
  const created=await request('/orders',{method:'POST',body:{productId:'p1',quantity:1},token});assert.equal(created.status,201);
  assert.equal((await request('/orders/'+created.body.id+'/status',{method:'PATCH',body:{status:'confirmed'},token})).status,200);
  assert.deepEqual(await request('/products/p1/stock',{token}),before);
}));
