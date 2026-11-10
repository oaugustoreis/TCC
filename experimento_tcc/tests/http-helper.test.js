import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadHelper() {
    const calls = [];
    const response = { status: 200 };
    const context = vm.createContext({ ArrayBuffer });
    const transport = new vm.SyntheticModule(['default'], function () {
        this.setExport('default', {
            request(...args) { calls.push(args); return response; },
        });
    }, { context });
    const helper = new vm.SourceTextModule(
        await readFile(new URL('../modular/helpers/http/http.js', import.meta.url), 'utf8'),
        { context },
    );
    await helper.link(() => transport);
    await helper.evaluate();
    return { http: helper.namespace, calls, response };
}

test('GET envia Bearer, preserva opções k6 e retorna a Response original', async () => {
    const { http, calls, response } = await loadHelper();
    assert.equal(http.get('/products', { token: 'abc', timeout: '5s' }), response);
    const [method, url, body, params] = calls[0];
    assert.equal(method, 'GET');
    assert.equal(url, '/products');
    assert.equal(body, null);
    assert.equal(params.headers.Authorization, 'Bearer abc');
    assert.equal(params.headers['Content-Type'], 'application/json');
    assert.equal(params.timeout, '5s');
    assert.equal('token' in params, false);
});

test('POST e PATCH serializam objetos e preservam strings JSON', async () => {
    const { http, calls } = await loadHelper();
    http.post('/auth/login', { username: 'user', password: 'pass' });
    http.patch('/orders/o1/status', { status: 'confirmed' }, { token: 'abc' });
    http.post('/orders', '{"quantity":1}');
    assert.equal(calls[0][0], 'POST');
    assert.equal(calls[0][2], '{"username":"user","password":"pass"}');
    assert.equal('Authorization' in calls[0][3].headers, false);
    assert.equal(calls[1][0], 'PATCH');
    assert.equal(calls[1][2], '{"status":"confirmed"}');
    assert.equal(calls[2][2], '{"quantity":1}');
});

test('headers explícitos prevalecem e opções recebidas não são modificadas', async () => {
    const { http, calls } = await loadHelper();
    const headers = Object.freeze({ authorization: 'Basic abc', 'Content-Type': 'text/plain' });
    const params = Object.freeze({ token: 'ignored', headers });
    http.post('/custom', 'body', params);
    assert.equal(calls[0][3].headers.authorization, 'Basic abc');
    assert.equal('Authorization' in calls[0][3].headers, false);
    assert.equal(calls[0][3].headers['Content-Type'], 'text/plain');
    assert.equal(params.headers, headers);
});

test('corpos binários e null são encaminhados sem serialização JSON', async () => {
    const { http, calls } = await loadHelper();
    const binary = new ArrayBuffer(4);
    const bytes = new Uint8Array(4);
    for (const body of [binary, bytes, null]) http.post('/upload', body);
    assert.equal(calls[0][2], binary);
    assert.equal(calls[1][2], bytes);
    assert.equal(calls[2][2], null);
});
