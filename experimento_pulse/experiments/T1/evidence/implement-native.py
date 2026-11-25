from instrument import write
c='pulse-native-variant'
write(c,'src/schemas/catalog/catalog.schema.ts','''export const productSchema = {
    type: 'object', required: ['id', 'name', 'price'],
    properties: { id: { type: 'number' }, name: { type: 'string' }, price: { type: 'number' } },
};
export const tokenSchema = { type: 'object', required: ['token'], properties: { token: { type: 'string' } } };
export const productsSchema = { type: 'array', items: productSchema };
''')
write(c,'src/use-cases/catalog/getCatalog.useCase.ts','''import { get, post } from '@pulse/http';
import { ps } from '@pulse/core';
import { productSchema, tokenSchema, productsSchema } from '@src/schemas/catalog/catalog.schema';
function contract(response: any, schema: any, property: string): any {
    ps.expect(response).bodyNotEmpty().header('Content-Type', 'application/json')
        .responseTimeLessThan(1500).jsonSchema(schema).hasProperty(property);
    return response.json();
}
function product(v: any): boolean {
    return !!v && typeof v.id === 'number' && typeof v.name === 'string' && v.name.length > 0 && typeof v.price === 'number';
}
export function authenticate(baseUrl: string): string {
    const data = contract(post(`${baseUrl}/authentication`, '{}', {}, 200, 'auth'), tokenSchema, 'token');
    ps.check(data, { 'auth token': () => !!data && typeof data.token === 'string' && data.token.length > 0 });
    return data.token;
}
export function listProducts(baseUrl: string, token: string): any {
    const data = contract(get(`${baseUrl}/products`, { token }, 200, 'list'), productsSchema, '0.id');
    ps.check(data, { 'list products': () => Array.isArray(data) && data.length > 0 && product(data[0]) });
    return data;
}
export function productDetails(baseUrl: string, token: string, id: number): void {
    const data = contract(get(`${baseUrl}/products/${id}`, { token }, 200, 'detail'), productSchema, 'id');
    ps.check(data, { 'detail product': () => product(data) && data.id === id });
}
''')
write(c,'src/flows/catalog/catalog.flow.ts','''import { ps } from '@pulse/core';
import { authenticate, listProducts, productDetails } from '@src/use-cases/catalog/getCatalog.useCase';
export function catalogFlow(baseUrl: string): void {
    ps.group('Catalog journey', () => {
        const token = authenticate(baseUrl);
        const products = listProducts(baseUrl, token);
        productDetails(baseUrl, token, products[0].id);
    });
    ps.sleep(1);
}
''')
write(c,'src/profiles/catalog/catalog.profiles.ts','''import { Options } from 'k6/options';
export const catalogProfiles: Options['scenarios'] = {
    "catalog_smoke_test": { executor: 'constant-vus', exec: 'engine', vus: 1, duration: '10s' },
};
''')
write(c,'src/scenarios/catalog/catalog.scenario.ts','''import { configResolver, Env } from '@pulse/config';
import { catalogFlow } from '@src/flows/catalog/catalog.flow';
export function setupCatalog(): { baseUrl: string } {
    const environment = configResolver.get('ENV', 'dev').toUpperCase();
    return { baseUrl: Env[`BASE_URL_${environment}`] || configResolver.get('BASE_URL', 'http://127.0.0.1:3333') };
}
export function catalogScenario(data: { baseUrl: string }): void {
    catalogFlow(data.baseUrl);
}
''')
write(c,'src/scenarios/catalog/thresholds.ts','''export const thresholds = {
    checks: ['rate==1'], http_req_failed: ['rate==0'], http_req_duration: ['p(95)<1500'],
};
''')
