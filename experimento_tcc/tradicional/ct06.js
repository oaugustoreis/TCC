import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-06 01 status': r => r.status === 200,
    'CT-06 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const products = http.get(`${BASE_URL}/products?category=principal`, { headers });
  const items = products.json('items');
  const firstItem = Array.isArray(items) && items.length === 1 ? items[0] : null;
  check(products, {
    'CT-06 02 status': r => r.status === 200,
    'CT-06 02 corpo': () => Boolean(
      firstItem &&
      firstItem.id === 'p1' &&
      firstItem.name === 'Produto A' &&
      firstItem.price === 100 &&
      firstItem.category === 'principal'
    ),
  });

  const product = http.get(`${BASE_URL}/products/p1`, { headers });
  check(product, {
    'CT-06 03 status': r => r.status === 200,
    'CT-06 03 corpo': r => Boolean(
      firstItem &&
      r.json('id') === 'p1' &&
      r.json('name') === 'Produto A' &&
      r.json('price') === 100 &&
      r.json('category') === 'principal' &&
      r.json('id') === firstItem.id &&
      r.json('name') === firstItem.name &&
      r.json('price') === firstItem.price &&
      r.json('category') === firstItem.category
    ),
  });
}
