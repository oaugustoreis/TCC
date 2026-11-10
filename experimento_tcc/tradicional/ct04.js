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

  const created = http.post(`${BASE_URL}/orders`, JSON.stringify({ productId: 'p1', quantity: 1 }), { headers });
  check(created, { 'pedido 201': r => r.status === 201, 'pedido criado': r => typeof r.json('id') === 'string' && r.json('status') === 'created' });
  const orderId = created.json('id');

  const order = http.get(`${BASE_URL}/orders/${orderId}`, { headers });
  check(order, { 'consulta 200': r => r.status === 200, 'pedido corresponde': r => r.json('id') === orderId, 'status esperado': r => r.json('status') === EXPECTED_STATUS });
}
