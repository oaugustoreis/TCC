import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';
test('jornada HTTP de autenticação, catálogo e pedido', async () => {
 const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 async function request(path, method='GET', body, token) {
  const res = await fetch(base+path, { method, headers: { ...(body ? {'content-type':'application/json'}:{}), ...(token ? {authorization:`Bearer ${token}`}:{}) }, body: body ? JSON.stringify(body) : undefined });
  return { status:res.status, data:await res.json() };
 }
 try {
  const login=await request('/auth/login','POST',{username:'pesquisador',password:'teste123'});assert.equal(login.status,200);
  const token=login.data.token;
  const products=await request('/products','GET',undefined,token);assert.equal(products.data.items.length,2);
  const product=await request('/products/p1','GET',undefined,token);assert.equal(product.data.id,'p1');
  const created=await request('/orders','POST',{productId:'p1',quantity:1},token);assert.equal(created.status,201);
  const id=created.data.id;
  const read=await request(`/orders/${id}`,'GET',undefined,token);assert.equal(read.data.id,id);
  const update=await request(`/orders/${id}/status`,'PATCH',{status:'confirmed'},token);assert.equal(update.data.status,'confirmed');
  const verify=await request(`/orders/${id}`,'GET',undefined,token);assert.equal(verify.data.status,'confirmed');
 } finally { await new Promise(resolve => server.close(resolve)); }
});
