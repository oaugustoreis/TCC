import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-10 01 status': r => r.status === 200,
    'CT-10 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const createdCart = http.post(`${BASE_URL}/carts`, JSON.stringify({}), { headers });
  const createdItems = createdCart.json('items');
  check(createdCart, {
    'CT-10 02 status': r => r.status === 201,
    'CT-10 02 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('status') === 'open' &&
      Array.isArray(createdItems) &&
      createdItems.length === 0 &&
      r.json('total') === 0
    ),
  });
  const cartId = createdCart.json('id');

  const addedItem = http.post(`${BASE_URL}/carts/${cartId}/items`, JSON.stringify({ productId: 'p1', quantity: 1 }), { headers });
  const addedItems = addedItem.json('items');
  const firstAdded = Array.isArray(addedItems) && addedItems.length === 1 ? addedItems[0] : null;
  check(addedItem, {
    'CT-10 03 status': r => r.status === 201,
    'CT-10 03 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      firstAdded &&
      firstAdded.productId === 'p1' &&
      firstAdded.quantity === 1 &&
      firstAdded.unitPrice === 100 &&
      firstAdded.subtotal === 100 &&
      r.json('total') === 100
    ),
  });

  const removedCart = http.del(`${BASE_URL}/carts/${cartId}/items/p1`, null, { headers });
  const removedItems = removedCart.json('items');
  check(removedCart, {
    'CT-10 04 status': r => r.status === 200,
    'CT-10 04 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      Array.isArray(removedItems) &&
      removedItems.length === 0 &&
      r.json('total') === 0
    ),
  });

  const fetchedCart = http.get(`${BASE_URL}/carts/${cartId}`, { headers });
  const fetchedItems = fetchedCart.json('items');
  check(fetchedCart, {
    'CT-10 05 status': r => r.status === 200,
    'CT-10 05 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      Array.isArray(fetchedItems) &&
      fetchedItems.length === 0 &&
      r.json('total') === 0
    ),
  });
}
