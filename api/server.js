import http from 'node:http';
const PORT = Number(process.env.PORT || 3333);
const TOKEN = 'token-experimental';
const products = [{ id: 'p1', name: 'Produto A', price: 100, category: 'principal' }, { id: 'p2', name: 'Produto B', price: 50, category: 'acessorio' }];
const stockQuantities = { p1: 10, p2: 0 };
let orders = new Map();
let nextId = 1;
function send(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
function authorized(req) { return req.headers.authorization === `Bearer ${TOKEN}`; }
async function parseBody(req) {
  let text = '';
  for await (const chunk of req) { text += chunk; if (text.length > 10000) throw Error('Payload muito grande'); }
  return text ? JSON.parse(text) : {};
}
export function createServer() {
 return http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  try {
   if (req.method === 'GET' && path === '/health') return send(res, 200, { status: 'ok' });
   if (req.method === 'POST' && path === '/auth/login') {
    const body = await parseBody(req);
    return body.username === 'pesquisador' && body.password === 'teste123'
      ? send(res, 200, { token: TOKEN, tokenType: 'Bearer' }) : send(res, 401, { error: 'Credenciais inválidas' });
   }
   if (!authorized(req)) return send(res, 401, { error: 'Não autorizado' });
   if (req.method === 'GET' && path === '/products') {
    const category = url.searchParams.get('category');
    return send(res, 200, { items: category === null ? products : products.filter(p => p.category === category) });
   }
   const stock = path.match(/^\/products\/([^/]+)\/stock$/);
   if (req.method === 'GET' && stock) {
    const found = products.find(p => p.id === stock[1]);
    if (!found) return send(res, 404, { error: 'Produto não encontrado' });
    const quantity = stockQuantities[found.id];
    return send(res, 200, { productId: found.id, quantity, available: quantity > 0 });
   }
   const product = path.match(/^\/products\/([^/]+)$/);
   if (req.method === 'GET' && product) {
    const found = products.find(p => p.id === product[1]);
    return found ? send(res, 200, found) : send(res, 404, { error: 'Produto não encontrado' });
   }
   if (req.method === 'POST' && path === '/orders') {
    const body = await parseBody(req);
    const found = products.find(p => p.id === body.productId);
    if (!found || !Number.isInteger(body.quantity) || body.quantity < 1)
      return send(res, 400, { error: 'Pedido inválido' });
    const order = { id: `o${nextId++}`, productId: found.id, quantity: body.quantity, status: 'created' };
    orders.set(order.id, order);
    return send(res, 201, order);
   }
   const orderMatch = path.match(/^\/orders\/(o\d+)$/);
   if (req.method === 'GET' && orderMatch) {
    const order = orders.get(orderMatch[1]);
    return order ? send(res, 200, order) : send(res, 404, { error: 'Pedido não encontrado' });
   }
   const statusMatch = path.match(/^\/orders\/(o\d+)\/status$/);
   if (req.method === 'PATCH' && statusMatch) {
    const order = orders.get(statusMatch[1]);
    if (!order) return send(res, 404, { error: 'Pedido não encontrado' });
    const body = await parseBody(req);
    if (body.status !== 'confirmed') return send(res, 400, { error: 'Status inválido' });
    order.status = body.status;
    return send(res, 200, order);
   }
   return send(res, 404, { error: 'Rota não encontrada' });
  } catch (error) { return send(res, error instanceof SyntaxError ? 400 : 413, { error: 'Requisição inválida' }); }
 });
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
 createServer().listen(PORT, '127.0.0.1', () => console.log(`API: http://127.0.0.1:${PORT}`));
}
