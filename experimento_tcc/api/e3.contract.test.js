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

test('E3: criar pedido, consultar por id e localizar na listagem filtrada por status=created (CT-11)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const created = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    assert.equal(created.status, 201);
    assert.match(created.body.id, /^o\d+$/);
    const expectedOrder = {
      id: created.body.id,
      productId: 'p1',
      quantity: 1,
      status: 'created',
    };
    assert.deepEqual(created.body, expectedOrder);

    const queried = await request(`/orders/${expectedOrder.id}`, { token });
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.body, expectedOrder);

    const listed = await request('/orders?status=created', { token });
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.body, { items: [expectedOrder] });
  }));

test('E3: cancelar pedido criado e consultar persistência de status=cancelled (CT-12)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const created = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    assert.equal(created.status, 201);
    const orderId = created.body.id;

    const cancelled = await request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status: 'cancelled' },
      token,
    });
    assert.equal(cancelled.status, 200);
    const expectedCancelled = {
      id: orderId,
      productId: 'p1',
      quantity: 1,
      status: 'cancelled',
    };
    assert.deepEqual(cancelled.body, expectedCancelled);

    const queried = await request(`/orders/${orderId}`, { token });
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.body, expectedCancelled);
  }));

test('E3: rotas de listagem e cancelamento validam 401, 400, 404 e transição inválida 409', () =>
  fixture(async ({ request, login }) => {
    assert.equal((await request('/orders?status=created')).status, 401);
    assert.equal(
      (await request('/orders/o1/status', { method: 'PATCH', body: { status: 'cancelled' } })).status,
      401
    );

    const token = await login();
    assert.equal(
      (await request('/orders/o999/status', { method: 'PATCH', body: { status: 'cancelled' }, token })).status,
      404
    );

    const { body: order } = await request('/orders', {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    assert.equal(
      (await request(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: 'unknown' }, token })).status,
      400
    );

    // Após confirmar, não pode cancelar (409) nem confirmar novamente (409)
    assert.equal(
      (await request(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: 'confirmed' }, token })).status,
      200
    );
    assert.equal(
      (await request(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: 'cancelled' }, token })).status,
      409
    );
    assert.equal(
      (await request(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: 'confirmed' }, token })).status,
      409
    );
  }));
