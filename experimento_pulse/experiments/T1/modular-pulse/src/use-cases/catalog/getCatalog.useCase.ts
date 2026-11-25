import { get, post } from '@pulse/http';
import { isProduct, validateBody } from '@src/schemas/catalog/catalog.schema';
export function authenticate(baseUrl: string): string {
    const response = post(`${baseUrl}/authentication`, '{}', {}, 200, 'auth');
    const data = validateBody(response, 'auth token', v => !!v && typeof v.token === 'string' && v.token.length > 0);
    return data && data.token;
}
export function listProducts(baseUrl: string, token: string): any {
    const response = get(`${baseUrl}/products`, { token }, 200, 'list');
    return validateBody(response, 'list products', v => Array.isArray(v) && v.length > 0 && isProduct(v[0]));
}
export function productDetails(baseUrl: string, token: string, id: number): any {
    const response = get(`${baseUrl}/products/${id}`, { token }, 200, 'detail');
    return validateBody(response, 'detail product', v => isProduct(v) && v.id === id);
}
