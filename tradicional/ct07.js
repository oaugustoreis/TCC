import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-07 01 status': r => r.status === 200,
    'CT-07 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const stockP1 = http.get(`${BASE_URL}/products/p1/stock`, { headers });
  check(stockP1, {
    'CT-07 02 status': r => r.status === 200,
    'CT-07 02 corpo': r => r.json('productId') === 'p1' && r.json('quantity') === 10 && r.json('available') === true,
  });

  const stockP2 = http.get(`${BASE_URL}/products/p2/stock`, { headers });
  check(stockP2, {
    'CT-07 03 status': r => r.status === 200,
    'CT-07 03 corpo': r => r.json('productId') === 'p2' && r.json('quantity') === 0 && r.json('available') === false,
  });
}
