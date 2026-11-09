import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-14 01 status': r => r.status === 200,
    'CT-14 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const createdOrder = http.post(`${BASE_URL}/orders`, JSON.stringify({ productId: 'p1', quantity: 1 }), { headers });
  check(createdOrder, {
    'CT-14 02 status': r => r.status === 201,
    'CT-14 02 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('productId') === 'p1' &&
      r.json('quantity') === 1 &&
      r.json('status') === 'created'
    ),
  });
  const orderId = createdOrder.json('id');

  const confirmedOrder = http.patch(`${BASE_URL}/orders/${orderId}/status`, JSON.stringify({ status: 'confirmed' }), { headers });
  check(confirmedOrder, {
    'CT-14 03 status': r => r.status === 200,
    'CT-14 03 corpo': r => Boolean(
      r.json('id') === orderId &&
      r.json('productId') === 'p1' &&
      r.json('quantity') === 1 &&
      r.json('status') === 'confirmed'
    ),
  });

  const createdPayment = http.post(`${BASE_URL}/payments`, JSON.stringify({ orderId, method: 'test_declined' }), { headers });
  check(createdPayment, {
    'CT-14 04 status': r => r.status === 201,
    'CT-14 04 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('orderId') === orderId &&
      r.json('amount') === 100 &&
      r.json('status') === 'declined'
    ),
  });
  const paymentId = createdPayment.json('id');

  const fetchedPayment = http.get(`${BASE_URL}/payments/${paymentId}`, { headers });
  check(fetchedPayment, {
    'CT-14 05 status': r => r.status === 200,
    'CT-14 05 corpo': r => Boolean(
      r.json('id') === paymentId &&
      r.json('orderId') === orderId &&
      r.json('amount') === 100 &&
      r.json('status') === 'declined'
    ),
  });

  const fetchedOrder = http.get(`${BASE_URL}/orders/${orderId}`, { headers });
  check(fetchedOrder, {
    'CT-14 06 status': r => r.status === 200,
    'CT-14 06 corpo': r => Boolean(
      r.json('id') === orderId &&
      r.json('productId') === 'p1' &&
      r.json('quantity') === 1 &&
      r.json('status') === 'confirmed'
    ),
  });
}
