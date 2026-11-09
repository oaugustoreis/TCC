import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, {
    'CT-15 01 status': r => r.status === 200,
    'CT-15 01 corpo': r => typeof r.json('token') === 'string' && r.json('token').length > 0 && r.json('tokenType') === 'Bearer',
  });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const product = http.get(`${BASE_URL}/products/p1`, { headers });
  check(product, {
    'CT-15 02 status': r => r.status === 200,
    'CT-15 02 corpo': r => Boolean(
      r.json('id') === 'p1' &&
      r.json('name') === 'Produto A' &&
      r.json('price') === 100 &&
      r.json('category') === 'principal'
    ),
  });

  const stock = http.get(`${BASE_URL}/products/p1/stock`, { headers });
  check(stock, {
    'CT-15 03 status': r => r.status === 200,
    'CT-15 03 corpo': r => r.json('productId') === 'p1' && r.json('quantity') === 10 && r.json('available') === true,
  });

  const createdCart = http.post(`${BASE_URL}/carts`, JSON.stringify({}), { headers });
  const createdItems = createdCart.json('items');
  check(createdCart, {
    'CT-15 04 status': r => r.status === 201,
    'CT-15 04 corpo': r => Boolean(
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
    'CT-15 05 status': r => r.status === 201,
    'CT-15 05 corpo': r => Boolean(
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

  const fetchedCart = http.get(`${BASE_URL}/carts/${cartId}`, { headers });
  const fetchedCartItems = fetchedCart.json('items');
  const firstFetchedCartItem = Array.isArray(fetchedCartItems) && fetchedCartItems.length === 1 ? fetchedCartItems[0] : null;
  check(fetchedCart, {
    'CT-15 06 status': r => r.status === 200,
    'CT-15 06 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'open' &&
      firstFetchedCartItem &&
      firstFetchedCartItem.productId === 'p1' &&
      firstFetchedCartItem.quantity === 1 &&
      firstFetchedCartItem.unitPrice === 100 &&
      firstFetchedCartItem.subtotal === 100 &&
      r.json('total') === 100
    ),
  });

  const createdOrder = http.post(`${BASE_URL}/orders`, JSON.stringify({ cartId }), { headers });
  const createdOrderItems = createdOrder.json('items');
  const firstOrderItem = Array.isArray(createdOrderItems) && createdOrderItems.length === 1 ? createdOrderItems[0] : null;
  check(createdOrder, {
    'CT-15 07 status': r => r.status === 201,
    'CT-15 07 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('cartId') === cartId &&
      r.json('status') === 'created' &&
      firstOrderItem &&
      firstOrderItem.productId === 'p1' &&
      firstOrderItem.quantity === 1 &&
      firstOrderItem.unitPrice === 100 &&
      firstOrderItem.subtotal === 100 &&
      r.json('total') === 100
    ),
  });
  const orderId = createdOrder.json('id');

  const confirmedOrder = http.patch(`${BASE_URL}/orders/${orderId}/status`, JSON.stringify({ status: 'confirmed' }), { headers });
  const confirmedOrderItems = confirmedOrder.json('items');
  const firstConfirmedOrderItem = Array.isArray(confirmedOrderItems) && confirmedOrderItems.length === 1 ? confirmedOrderItems[0] : null;
  check(confirmedOrder, {
    'CT-15 08 status': r => r.status === 200,
    'CT-15 08 corpo': r => Boolean(
      r.json('id') === orderId &&
      r.json('cartId') === cartId &&
      r.json('status') === 'confirmed' &&
      firstConfirmedOrderItem &&
      firstConfirmedOrderItem.productId === 'p1' &&
      firstConfirmedOrderItem.quantity === 1 &&
      firstConfirmedOrderItem.unitPrice === 100 &&
      firstConfirmedOrderItem.subtotal === 100 &&
      r.json('total') === 100
    ),
  });

  const createdPayment = http.post(`${BASE_URL}/payments`, JSON.stringify({ orderId, method: 'test_approved' }), { headers });
  check(createdPayment, {
    'CT-15 09 status': r => r.status === 201,
    'CT-15 09 corpo': r => Boolean(
      typeof r.json('id') === 'string' &&
      r.json('id').length > 0 &&
      r.json('orderId') === orderId &&
      r.json('amount') === 100 &&
      r.json('status') === 'approved'
    ),
  });
  const paymentId = createdPayment.json('id');

  const fetchedPayment = http.get(`${BASE_URL}/payments/${paymentId}`, { headers });
  check(fetchedPayment, {
    'CT-15 10 status': r => r.status === 200,
    'CT-15 10 corpo': r => Boolean(
      r.json('id') === paymentId &&
      r.json('orderId') === orderId &&
      r.json('amount') === 100 &&
      r.json('status') === 'approved'
    ),
  });

  const fetchedPaidOrder = http.get(`${BASE_URL}/orders/${orderId}`, { headers });
  const paidOrderItems = fetchedPaidOrder.json('items');
  const firstPaidOrderItem = Array.isArray(paidOrderItems) && paidOrderItems.length === 1 ? paidOrderItems[0] : null;
  check(fetchedPaidOrder, {
    'CT-15 11 status': r => r.status === 200,
    'CT-15 11 corpo': r => Boolean(
      r.json('id') === orderId &&
      r.json('cartId') === cartId &&
      r.json('status') === 'paid' &&
      firstPaidOrderItem &&
      firstPaidOrderItem.productId === 'p1' &&
      firstPaidOrderItem.quantity === 1 &&
      firstPaidOrderItem.unitPrice === 100 &&
      firstPaidOrderItem.subtotal === 100 &&
      r.json('total') === 100
    ),
  });

  const fetchedCheckedOutCart = http.get(`${BASE_URL}/carts/${cartId}`, { headers });
  const checkedOutCartItems = fetchedCheckedOutCart.json('items');
  const firstCheckedOutCartItem = Array.isArray(checkedOutCartItems) && checkedOutCartItems.length === 1 ? checkedOutCartItems[0] : null;
  check(fetchedCheckedOutCart, {
    'CT-15 12 status': r => r.status === 200,
    'CT-15 12 corpo': r => Boolean(
      r.json('id') === cartId &&
      r.json('status') === 'checked_out' &&
      firstCheckedOutCartItem &&
      firstCheckedOutCartItem.productId === 'p1' &&
      firstCheckedOutCartItem.quantity === 1 &&
      firstCheckedOutCartItem.unitPrice === 100 &&
      firstCheckedOutCartItem.subtotal === 100 &&
      r.json('total') === 100
    ),
  });
}
