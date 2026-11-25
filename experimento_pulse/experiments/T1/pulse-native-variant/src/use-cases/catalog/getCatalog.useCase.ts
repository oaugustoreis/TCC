import { get, post } from '@pulse/http';
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
