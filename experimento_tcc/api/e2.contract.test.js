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

test('E2: criar carrinho vazio, adicionar item e consultar snapshot (CT-08)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const created = await request('/carts', { method: 'POST', body: {}, token });
    assert.equal(created.status, 201);
    assert.match(created.body.id, /^c\d+$/);
    const cartId = created.body.id;
    assert.deepEqual(created.body, { id: cartId, status: 'open', items: [], total: 0 });

    const added = await request(`/carts/${cartId}/items`, {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });
    assert.equal(added.status, 201);
    const expectedAdded = {
      id: cartId,
      status: 'open',
      items: [{ productId: 'p1', quantity: 1, unitPrice: 100, subtotal: 100 }],
      total: 100,
    };
    assert.deepEqual(added.body, expectedAdded);

    const queried = await request(`/carts/${cartId}`, { token });
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.body, expectedAdded);
  }));

test('E2: atualizar quantidade recalcula subtotal e total sem duplicar item (CT-09)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const { body: cart } = await request('/carts', { method: 'POST', body: {}, token });
    await request(`/carts/${cart.id}/items`, {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });

    const updated = await request(`/carts/${cart.id}/items/p1`, {
      method: 'PATCH',
      body: { quantity: 3 },
      token,
    });
    assert.equal(updated.status, 200);
    const expectedUpdated = {
      id: cart.id,
      status: 'open',
      items: [{ productId: 'p1', quantity: 3, unitPrice: 100, subtotal: 300 }],
      total: 300,
    };
    assert.deepEqual(updated.body, expectedUpdated);

    const queried = await request(`/carts/${cart.id}`, { token });
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.body, expectedUpdated);
  }));

test('E2: remover item zera items e total do carrinho aberto (CT-10)', () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    const { body: cart } = await request('/carts', { method: 'POST', body: {}, token });
    await request(`/carts/${cart.id}/items`, {
      method: 'POST',
      body: { productId: 'p1', quantity: 1 },
      token,
    });

    const removed = await request(`/carts/${cart.id}/items/p1`, {
      method: 'DELETE',
      token,
    });
    assert.equal(removed.status, 200);
    const expectedEmpty = { id: cart.id, status: 'open', items: [], total: 0 };
    assert.deepEqual(removed.body, expectedEmpty);

    const queried = await request(`/carts/${cart.id}`, { token });
    assert.equal(queried.status, 200);
    assert.deepEqual(queried.body, expectedEmpty);
  }));

test('E2: rotas de carrinho exigem Bearer válido (401) e validam 400/404', () =>
  fixture(async ({ request, login }) => {
    for (const [method, route, body] of [
      ['POST', '/carts', {}],
      ['GET', '/carts/c1', undefined],
      ['POST', '/carts/c1/items', { productId: 'p1', quantity: 1 }],
      ['PATCH', '/carts/c1/items/p1', { quantity: 3 }],
      ['DELETE', '/carts/c1/items/p1', undefined],
    ]) {
      const unauth = await request(route, { method, body });
      assert.equal(unauth.status, 401);
    }

    const token = await login();
    assert.equal((await request('/carts/c999', { token })).status, 404);
    assert.equal(
      (await request('/carts/c999/items', { method: 'POST', body: { productId: 'p1', quantity: 1 }, token })).status,
      404
    );

    const { body: cart } = await request('/carts', { method: 'POST', body: {}, token });
    assert.equal(
      (await request(`/carts/${cart.id}/items`, { method: 'POST', body: { productId: 'inexistente', quantity: 1 }, token })).status,
      404
    );
    assert.equal(
      (await request(`/carts/${cart.id}/items`, { method: 'POST', body: { productId: 'p1', quantity: 0 }, token })).status,
      400
    );
    assert.equal(
      (await request(`/carts/${cart.id}/items`, { method: 'POST', body: { productId: 'p1', quantity: 1.5 }, token })).status,
      400
    );
    assert.equal(
      (await request(`/carts/${cart.id}/items/p1`, { method: 'PATCH', body: { quantity: 2 }, token })).status,
      404
    );
    assert.equal((await request(`/carts/${cart.id}/items/p1`, { method: 'DELETE', token })).status, 404);
  }));
