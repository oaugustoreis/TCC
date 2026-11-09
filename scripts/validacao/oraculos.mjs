// Oráculo declarativo derivado da matriz congelada; sem imports da API ou das suítes.
export const CREDENTIALS={username:'pesquisador',password:'teste123'};
const login={method:'POST',path:'/auth/login',payload:CREDENTIALS,status:200,kind:'login'};
const products={method:'GET',path:'/products',status:200,kind:'products'};
const product={method:'GET',path:'/products/p1',status:200,kind:'product'};
const create={method:'POST',path:'/orders',payload:{productId:'p1',quantity:1},status:201,kind:'create'};
const read=expectedStatus=>({method:'GET',path:'/orders/:orderId',status:200,kind:'order',expectedStatus});
const confirm={method:'PATCH',path:'/orders/:orderId/status',payload:{status:'confirmed'},status:200,kind:'order',expectedStatus:'confirmed'};
const createCart={method:'POST',path:'/carts',payload:{},status:201,kind:'create-cart'};
const addCartItem={method:'POST',path:'/carts/:cartId/items',payload:{productId:'p1',quantity:1},status:201,kind:'cart-snapshot',expectedItems:[{productId:'p1',quantity:1,unitPrice:100,subtotal:100}],expectedTotal:100};
const updateCartItem={method:'PATCH',path:'/carts/:cartId/items/p1',payload:{quantity:3},status:200,kind:'cart-snapshot',expectedItems:[{productId:'p1',quantity:3,unitPrice:100,subtotal:300}],expectedTotal:300};
const deleteCartItem={method:'DELETE',path:'/carts/:cartId/items/p1',status:200,kind:'cart-snapshot',expectedItems:[],expectedTotal:0};
const readCart=(expectedItems,expectedTotal,expectedStatus='open')=>({method:'GET',path:'/carts/:cartId',status:200,kind:'cart-snapshot',expectedItems,expectedTotal,expectedStatus});
const checks={
 ct01:['login 200','token presente'],
 ct02:['login 200','token presente','lista 200','produtos disponíveis','produto 200','produto p1'],
 ct03:['login 200','token presente','produto 200','produto p1','pedido 201','pedido criado'],
 ct04:['login 200','token presente','pedido 201','pedido criado','consulta 200','pedido corresponde','status esperado'],
 ct05:['login 200','token presente','pedido 201','pedido criado','atualização 200','status confirmado','consulta 200','pedido corresponde','status esperado']
};
const definitions={
 ct01:{journey:'autenticacao/autenticacao',steps:[login]},
 ct02:{journey:'catalogo/catalogo',steps:[login,products,product]},
 ct03:{journey:'pedidos/criacao',steps:[login,product,create]},
 ct04:{journey:'pedidos/consulta',steps:[login,create,read('created')]},
 ct05:{journey:'pedidos/atualizacao',steps:[login,create,confirm,read('confirmed')]},
 ct06:{steps:[login,{...products,path:'/products?category=principal',kind:'filtered-products'},{...product,kind:'product-e1'}]},
 ct07:{steps:[login,...['p1','p2'].map(productId=>({method:'GET',path:'/products/'+productId+'/stock',status:200,kind:'stock',productId}))]},
 ct08:{steps:[login,createCart,addCartItem,readCart([{productId:'p1',quantity:1,unitPrice:100,subtotal:100}],100)]},
 ct09:{steps:[login,createCart,addCartItem,updateCartItem,readCart([{productId:'p1',quantity:3,unitPrice:100,subtotal:300}],300)]},
 ct10:{steps:[login,createCart,addCartItem,deleteCartItem,readCart([],0)]}
};
for(const [id,spec]of Object.entries(definitions)){
 spec.checks=checks[id]||spec.steps.flatMap((_,i)=>['status','corpo'].map(suffix=>id.toUpperCase().replace('CT','CT-')+' '+String(i+1).padStart(2,'0')+' '+suffix));
 spec.id=id;
}
export const SCENARIOS=definitions;
export const E0_IDS=['ct01','ct02','ct03','ct04','ct05'];
export const E1_IDS=[...E0_IDS,'ct06','ct07'];
export const E2_IDS=[...E1_IDS,'ct08','ct09','ct10'];
export function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
 return value;
}
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const subset=(actual,expected)=>expected!==null&&typeof expected==='object'
 ? actual!==null&&typeof actual==='object'&&Object.keys(expected).every(k=>subset(actual[k],expected[k]))
 : actual===expected;
const nonempty=v=>typeof v==='string'&&v.length>0;
const productFixture=id=>({id,name:id==='p1'?'Produto A':'Produto B',price:id==='p1'?100:50});
const headersLower=h=>Object.fromEntries(Object.entries(h||{}).map(([k,v])=>[k.toLowerCase(),v]));
const media=value=>typeof value==='string'?value.split(';')[0].trim().toLowerCase():'';
export function validateHttp(id,received,{host,client='k6'}={}){
 const spec=SCENARIOS[id];if(!spec)throw Error('Cenário desconhecido: '+id);
 const errors=[];const expect=(condition,message)=>{if(!condition)errors.push(message)};
 const context={token:null,orderId:null,cartId:null};
 expect(received.length===spec.steps.length,'quantidade de requisições');
 for(const [i,step] of spec.steps.entries()){
  const r=received[i];const label=id+' operação '+(i+1);
  if(!r){errors.push(label+': ausente');continue;}
  const headers=headersLower(r.headers), responseHeaders=headersLower(r.responseHeaders);
  expect(r.sequence===i+1,label+': sequência');
  expect(r.method===step.method,label+': método');
  let actualUrl;
  try{actualUrl=new URL(r.path,'http://local.invalid');}catch{errors.push(label+': URL inválida');continue;}
  const target=new URL(step.path.replace(':orderId',context.orderId).replace(':cartId',context.cartId),'http://local.invalid');
  expect(actualUrl.pathname===target.pathname,label+': rota');
  expect(same([...actualUrl.searchParams].sort(),[...target.searchParams].sort()),label+': query');
  expect(media(headers['content-type'])==='application/json',label+': Content-Type request');
  if(host)expect(headers.host===host,label+': Host');
  if(client==='k6')expect(typeof headers['user-agent']==='string'&&headers['user-agent'].startsWith('Grafana k6/'),label+': User-Agent k6');
  expect(step.kind==='login'?headers.authorization===undefined:headers.authorization==='Bearer '+context.token,label+': Authorization');
  if(step.payload===undefined)expect(r.payload==='',label+': body inesperado');
  else{
   try{expect(same(JSON.parse(r.payload),step.payload),label+': payload');}catch{errors.push(label+': payload JSON inválido');}
   expect(String(headers['content-length'])===String(Buffer.byteLength(r.payload||'')),label+': Content-Length');
  }
  expect(r.status===step.status,label+': status HTTP');
  expect(media(responseHeaders['content-type'])==='application/json',label+': Content-Type response');
  let body;
  try{body=JSON.parse(r.responseBody);}catch{errors.push(label+': resposta JSON inválida');continue;}
  if(body===null||typeof body!=='object'||Array.isArray(body)){errors.push(label+': corpo deve ser objeto JSON');continue;}
  let valid=false;
  if(step.kind==='login'){valid=nonempty(body.token)&&body.tokenType==='Bearer';context.token=body.token;}
  if(step.kind==='product'||step.kind==='product-e1')valid=subset(body,{...productFixture('p1'),...(step.kind==='product-e1'?{category:'principal'}:{})});
  if(step.kind==='products')valid=Array.isArray(body.items)&&body.items.length===2&&['p1','p2'].every((p,j)=>subset(body.items[j],productFixture(p)));
  if(step.kind==='filtered-products')valid=Array.isArray(body.items)&&body.items.length===1&&subset(body.items[0],{...productFixture('p1'),category:'principal'});
  if(step.kind==='stock')valid=subset(body,{productId:step.productId,quantity:step.productId==='p1'?10:0,available:step.productId==='p1'});
  if(step.kind==='create'){valid=nonempty(body.id)&&subset(body,{productId:'p1',quantity:1,status:'created'});context.orderId=body.id;}
  if(step.kind==='order')valid=subset(body,{id:context.orderId,productId:'p1',quantity:1,status:step.expectedStatus});
  if(step.kind==='create-cart'){valid=nonempty(body.id)&&body.status==='open'&&Array.isArray(body.items)&&body.items.length===0&&body.total===0;context.cartId=body.id;}
  if(step.kind==='cart-snapshot'){
   const expectedStatus=step.expectedStatus||'open';
   valid=body.id===context.cartId&&body.status===expectedStatus&&body.total===step.expectedTotal
    &&Array.isArray(body.items)&&body.items.length===step.expectedItems.length
    &&step.expectedItems.every((exp,idx)=>subset(body.items[idx],exp));
  }
  expect(valid,label+': campos obrigatórios da resposta');
 }
 return {passed:errors.length===0,errors,expected_requests:spec.steps.length,received_requests:received.length,context};
}
export function validateRun(id,{received,checks,options,suite,scenarioKey=id,metrics,exitCode,inspectionExit,apiReady,host}){
 const errors=[...validateHttp(id,received,{host}).errors];
 const check=(v,message)=>{if(!v)errors.push(message)};
 const spec=SCENARIOS[id];
 const scenarios=options?.scenarios;
 const named=scenarios&&Object.keys(scenarios).length>0;
 const effective=named?scenarios[scenarioKey]:options;
 check(suite==='tradicional'||suite==='modular','arquitetura');
 check(!named||Object.keys(scenarios).length===1,'apenas um cenário na entrada');
 check(suite!=='modular'||!!named,'profile modular nomeado');
 check(effective?.vus===1&&effective?.iterations===1,'1 VU e 1 iteração');
 check(!named||effective?.executor==='shared-iterations','executor shared-iterations');
 check(options?.thresholds?.checks?.some(t=>(typeof t==='string'?t:t.threshold)==='rate==1'),'threshold checks rate==1');
 check(same(checks.map(c=>c.name),spec.checks),'quantidade, ordem e labels de checks');
 check(checks.every(c=>c.value===1),'resultados dos checks');
 check(metrics.iterations===1,'uma iteração concluída');
 check(metrics.http_reqs===spec.steps.length,'contagem http_reqs');
 check(metrics.http_req_failed===0,'nenhuma falha HTTP');
 check(exitCode===0&&inspectionExit===0,'saídas k6 run/inspect zero');
 check(apiReady===true,'prontidão da API');
 return {passed:errors.length===0,errors,expected_requests:spec.steps.length,expected_checks:spec.checks.length};
}
export function canonicalTrace(received){
 let token=null,orderId=null,cartId=null;
 for(const r of received){
  const body=JSON.parse(r.responseBody);
  if(r.path==='/auth/login')token=body.token;
  if(r.method==='POST'&&r.path==='/orders')orderId=body.id;
  if(r.method==='POST'&&r.path==='/carts')cartId=body.id;
 }
 const normalize=value=>{
  if(value===token&&token!==null)return '<token>';
  if(value===orderId&&orderId!==null)return '<orderId>';
  if(value===cartId&&cartId!==null)return '<cartId>';
  if(Array.isArray(value))return value.map(normalize);
  if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)]));
  return value;
 };
 const normPath=p=>{
  let res=p;
  if(orderId)res=res.replace('/orders/'+orderId,'/orders/<orderId>');
  if(cartId)res=res.replace('/carts/'+cartId,'/carts/<cartId>');
  return res;
 };
 return stable(received.map(r=>({method:r.method,path:normPath(r.path),
  headers:{'content-type':media(headersLower(r.headers)['content-type']),authorization:headersLower(r.headers).authorization?'Bearer <token>':null},
  payload:r.payload?normalize(JSON.parse(r.payload)):null,status:r.status,response:normalize(JSON.parse(r.responseBody))})));
}
