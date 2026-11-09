import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

async function fixture(work) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(route, { method = 'GET', body, token } = {}) {
    const headers = {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    };
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const response = await fetch(base + route, {
      method,
      headers,
      body: payload,
      signal: AbortSignal.timeout(3000),
    });
    const raw = await response.text();
    assert.match(response.headers.get('content-type'), /^application\/json/);
    return { status: response.status, body: JSON.parse(raw) };
  }
  async function login() {
    const r = await request('/auth/login', {
      method: 'POST',
      body: { username: 'pesquisador', password: 'teste123' },
    });
    assert.equal(r.status, 200);
    return r.body.token;
  }
  try {
    await work({ request, login });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('E4: aprovar pagamento de pedido confirmado muda pedido para paid (CT-13)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const { body: order } = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    await request(`/orders/${order.id}/status`, {
      method: 'PATCH',
      body: { status: 'confirmed' },
      token,
    });

    const paid = await request('/payments', {
      method: 'POST',
      body: { orderId: order.id, method: 'test_approved' },
      token,
    });
    assert.equal(paid.status, 201);
    assert.match(paid.body.id, /^pay\d+$/);
    assert.deepEqual(paid.body, {
      id: paid.body.id,
      orderId: order.id,
      amount: 100,
      status: 'approved',
    });

    const getPayment = await request(`/payments/${paid.body.id}`, { token });
    assert.equal(getPayment.status, 200);
    assert.deepEqual(getPayment.body, paid.body);

    const getOrder = await request(`/orders/${order.id}`, { token });
    assert.equal(getOrder.status, 200);
    assert.deepEqual(getOrder.body, {
      id: order.id,
      productId: 'p1',
      quantity: 1,
      status: 'paid',
    });
  }));

test('E4: recusar pagamento preserva pedido confirmado (CT-14)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const { body: order } = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    await request(`/orders/${order.id}/status`, {
      method: 'PATCH',
      body: { status: 'confirmed' },
      token,
    });

    const declined = await request('/payments', {
      method: 'POST',
      body: { orderId: order.id, method: 'test_declined' },
      token,
    });
    assert.equal(declined.status, 201);
    assert.deepEqual(declined.body, {
      id: declined.body.id,
      orderId: order.id,
      amount: 100,
      status: 'declined',
    });

    const getPayment = await request(`/payments/${declined.body.id}`, { token });
    assert.equal(getPayment.status, 200);
    assert.deepEqual(getPayment.body, declined.body);

    const getOrder = await request(`/orders/${order.id}`, { token });
    assert.equal(getOrder.status, 200);
    assert.deepEqual(getOrder.body, {
      id: order.id,
      productId: 'p1',
      quantity: 1,
      status: 'confirmed',
    });
  }));

test('E4: compra completa por carrinho cria pedido com snapshot, marca checked_out e paga (CT-15)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const { body: cart } = await request('/carts', { method: 'POST', body: {}, token });
    await request(`/carts/${cart.id}/items`, {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });

    const createdOrder = await request('/orders', {
      method: 'POST',
      body: { cartId: cart.id },
      token,
    });
    assert.equal(createdOrder.status, 201);
    const expectedItems = [{ productId: 'p1', quantity: 1, unitPrice: 100, subtotal: 100 }];
    assert.deepEqual(createdOrder.body, {
      id: createdOrder.body.id,
      cartId: cart.id,
      items: expectedItems,
      total: 100,
      status: 'created',
    });

    const confirmedOrder = await request(`/orders/${createdOrder.body.id}/status`, {
      method: 'PATCH',
      body: { status: 'confirmed' },
      token,
    });
    assert.equal(confirmedOrder.status, 200);
    assert.equal(confirmedOrder.body.status, 'confirmed');

    const payment = await request('/payments', {
      method: 'POST',
      body: { orderId: createdOrder.body.id, method: 'test_approved' },
      token,
    });
    assert.equal(payment.status, 201);
    assert.equal(payment.body.status, 'approved');
    assert.equal(payment.body.amount, 100);

    const finalOrder = await request(`/orders/${createdOrder.body.id}`, { token });
    assert.equal(finalOrder.status, 200);
    assert.deepEqual(finalOrder.body, {
      id: createdOrder.body.id,
      cartId: cart.id,
      items: expectedItems,
      total: 100,
      status: 'paid',
    });

    const finalCart = await request(`/carts/${cart.id}`, { token });
    assert.equal(finalCart.status, 200);
    assert.deepEqual(finalCart.body, {
      id: cart.id,
      status: 'checked_out',
      items: expectedItems,
      total: 100,
    });
  }));

test('E4: rotas de pagamento e checkout de carrinho validam 401, 400, 404 e 409', () =>
  fixture(async ({ request, login }) => {
    assert.equal(
      (await request('/payments', { method: 'POST', body: { orderId: 'o1', method: 'test_approved' } })).status,
      401
    );
    assert.equal((await request('/payments/pay1')).status, 401);

    const token = await login();
    assert.equal((await request('/payments/pay999', { token })).status, 404);
    assert.equal(
      (await request('/orders', { method: 'POST', body: { cartId: 'c999' }, token })).status,
      404
    );

    const { body: emptyCart } = await request('/carts', { method: 'POST', body: {}, token });
    assert.equal(
      (await request('/orders', { method: 'POST', body: { cartId: emptyCart.id }, token })).status,
      409
    );

    const { body: order } = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    assert.equal(
      (await request('/payments', { method: 'POST', body: { orderId: order.id, method: 'unknown' }, token })).status,
      400
    );
    assert.equal(
      (await request('/payments', { method: 'POST', body: { orderId: 'o999', method: 'test_approved' }, token })).status,
      404
    );
    // Pedido ainda created -> 409
    assert.equal(
      (await request('/payments', { method: 'POST', body: { orderId: order.id, method: 'test_approved' }, token })).status,
      409
    );
  }));
