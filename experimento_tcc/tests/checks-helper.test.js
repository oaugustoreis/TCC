import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function loadHelper() {
    const results = [];
    const context = vm.createContext({});
    const k6 = new vm.SyntheticModule(['check'], function () {
        this.setExport('check', (response, predicates) => {
            const checks = Object.entries(predicates).map(([label, predicate]) => ({ label, passed: predicate(response) }));
            results.push(...checks);
            return checks.every(({ passed }) => passed);
        });
    }, { context });
    const helper = new vm.SourceTextModule(
        await readFile(new URL('../modular/helpers/checks/checks.js', import.meta.url), 'utf8'),
        { context },
    );
    await helper.link(() => k6);
    await helper.evaluate();
    return { ...helper.namespace, results };
}
const response = (body, status = 200) => ({ status, json: (field) => body[field] });

test('compara status, valores e tipos sem coerção', async () => {
    const { checkResponse, results } = await loadHelper();
    assert.equal(checkResponse(response({ id: 'o1', token: 42 }, 201), {
        status: { expected: 200, label: 'http' },
        fields: {
            id: { expected: 'o1', label: 'pedido' },
            token: { type: 'string', label: 'token' },
        },
    }), false);
    assert.deepEqual(results, [
        { label: 'http', passed: false }, { label: 'pedido', passed: true }, { label: 'token', passed: false },
    ]);
});

test('mesmo label agrupa campos em um check que exige todas as condições', async () => {
    for (const body of [{ id: 'o1', status: 'created' }, { id: 1, status: 'created' }, { id: 'o1', status: 'confirmed' }]) {
        const { checkFields, results } = await loadHelper();
        const expected = typeof body.id === 'string' && body.status === 'created';
        assert.equal(checkFields(response(body), {
            id: { type: 'string', label: 'pedido criado' },
            status: { expected: 'created', label: 'pedido criado' },
        }), expected);
        assert.deepEqual(results, [{ label: 'pedido criado', passed: expected }]);
    }
});

test('valida arrays não vazios e rejeita campo ausente', async () => {
    for (const body of [{ items: [1] }, { items: [] }, { items: 'abc' }, {}]) {
        const { checkFields } = await loadHelper();
        assert.equal(checkFields(response(body), {
            items: { type: 'array', nonEmpty: true, label: 'lista' },
        }), Array.isArray(body.items) && body.items.length > 0);
    }
});

test('aceita valores esperados falsy sem ignorar a comparação', async () => {
    const { checkFields } = await loadHelper();
    for (const expected of [false, 0, '', null]) {
        assert.equal(checkFields(response({ value: expected }), { value: { expected } }), true);
        assert.equal(checkFields(response({ value: 'different' }), { value: { expected } }), false);
    }
});
