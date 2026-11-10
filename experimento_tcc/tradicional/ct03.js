import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const EXPECTED_STATUS = 'created';
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, { 'login 200': r => r.status === 200, 'token presente': r => typeof r.json('token') === 'string' });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const product = http.get(`${BASE_URL}/products/p1`, { headers });
  check(product, { 'produto 200': r => r.status === 200, 'produto p1': r => r.json('id') === 'p1' });

  const created = http.post(`${BASE_URL}/orders`, JSON.stringify({ productId: 'p1', quantity: 1 }), { headers });
  check(created, { 'pedido 201': r => r.status === 201, 'pedido criado': r => typeof r.json('id') === 'string' && r.json('status') === 'created' });
  const orderId = created.json('id');
}
