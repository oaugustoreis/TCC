import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-09 01 status': r => r.status === 200,
    'CT-09 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const createdCart = http.post(`${BASE_URL}/carts`, JSON.stringify({}), { headers });
  const createdItems = createdCart.json('items');
  check(createdCart, {
    'CT-09 02 status': r => r.status === 201,
    'CT-09 02 corpo': r => Boolean(
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
    'CT-09 03 status': r => r.status === 201,
    'CT-09 03 corpo': r => Boolean(
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

  const updatedCart = http.patch(`${BASE_URL}/carts/${cartId}/items/p1`, JSON.stringify({ quantity: 3 }), { headers });
  const updatedItems = updatedCart.json('items');
  const firstUpdated = Array.isArray(updatedItems) && updatedItems.length === 1 ? updatedItems[0] : null;
  check(updatedCart, {
    'CT-09 04 status': r => r.status === 200,
    'CT-09 04 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      firstUpdated &&
      firstUpdated.productId === 'p1' &&
      firstUpdated.quantity === 3 &&
      firstUpdated.unitPrice === 100 &&
      firstUpdated.subtotal === 300 &&
      r.json('total') === 300
    ),
  });

  const fetchedCart = http.get(`${BASE_URL}/carts/${cartId}`, { headers });
  const fetchedItems = fetchedCart.json('items');
  const firstFetched = Array.isArray(fetchedItems) && fetchedItems.length === 1 ? fetchedItems[0] : null;
  check(fetchedCart, {
    'CT-09 05 status': r => r.status === 200,
    'CT-09 05 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      firstFetched &&
      firstFetched.productId === 'p1' &&
      firstFetched.quantity === 3 &&
      firstFetched.unitPrice === 100 &&
      firstFetched.subtotal === 300 &&
      r.json('total') === 300
    ),
  });
}
