import http from 'k6/http';
import { check } from 'k6';
import { body, product } from '../contracts/responses.js';
export function listProducts(baseUrl, token) {
  const response = http.get(`${baseUrl}/products`, { headers: { Authorization: `Bearer ${token}` } });
  check(response, { 'list status is 200': r => r.status === 200 });
  return body(response, 'list products', v => Array.isArray(v) && v.length > 0 && product(v[0]));
}
export function getProduct(baseUrl, token, id) {
  const response = http.get(`${baseUrl}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  check(response, { 'detail status is 200': r => r.status === 200 });
  return body(response, 'detail product', v => product(v) && v.id === id);
}
