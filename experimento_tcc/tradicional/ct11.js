import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-11 01 status': r => r.status === 200,
    'CT-11 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const createdOrder = http.post(`${BASE_URL}/orders`, JSON.stringify({ productId: 'p1', quantity: 1 }), { headers });
  check(createdOrder, {
    'CT-11 02 status': r => r.status === 201,
    'CT-11 02 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('productId') === 'p1' &&
      r.json('quantity') === 1 &&
      r.json('status') === 'created'
    ),
  });
  const orderId = createdOrder.json('id');

  const fetchedOrder = http.get(`${BASE_URL}/orders/${orderId}`, { headers });
  check(fetchedOrder, {
    'CT-11 03 status': r => r.status === 200,
    'CT-11 03 corpo': r => Boolean(
      r.json('id') === orderId &&
      r.json('productId') === 'p1' &&
      r.json('quantity') === 1 &&
      r.json('status') === 'created'
    ),
  });

  const listedOrders = http.get(`${BASE_URL}/orders?status=created`, { headers });
  const items = listedOrders.json('items');
  const firstOrder = Array.isArray(items) && items.length === 1 ? items[0] : null;
  check(listedOrders, {
    'CT-11 04 status': r => r.status === 200,
    'CT-11 04 corpo': () => Boolean(
      firstOrder &&
      firstOrder.id === orderId &&
      firstOrder.productId === 'p1' &&
      firstOrder.quantity === 1 &&
      firstOrder.status === 'created'
    ),
  });
}
