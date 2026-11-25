from instrument import write
c='modular-manual'
write(c,'config/environment.js','''export const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3333';
''')
write(c,'profiles/smoke.js','''export const scenarios = {
  journey: { executor: 'constant-vus', vus: 1, duration: '10s' },
};
export const thresholds = {
  checks: ['rate==1'],
  http_req_failed: ['rate==0'],
  http_req_duration: ['p(95)<1500'],
};
''')
write(c,'contracts/responses.js','''import { check } from 'k6';
export function product(value) {
  return value && typeof value.id === 'number' &&
    typeof value.name === 'string' && value.name.length > 0 &&
    typeof value.price === 'number';
}
export function body(response, name, predicate) {
  let value = null;
  try { value = response.json(); } catch (_) {}
  check(value, { [name]: predicate });
  return value;
}
''')
write(c,'use-cases/authenticate.js','''import http from 'k6/http';
import { check } from 'k6';
import { body } from '../contracts/responses.js';
export function authenticate(baseUrl) {
  const response = http.post(`${baseUrl}/authentication`, '{}', {
    headers: { 'Content-Type': 'application/json' },
  });
  check(response, { 'auth status is 200': r => r.status === 200 });
  const data = body(response, 'auth token', v => !!v && typeof v.token === 'string' && v.token.length > 0);
  return data && data.token;
}
''')
write(c,'use-cases/products.js','''import http from 'k6/http';
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
''')
write(c,'flows/journey.js','''import { sleep } from 'k6';
import { authenticate } from '../use-cases/authenticate.js';
import { listProducts, getProduct } from '../use-cases/products.js';
export function journey(baseUrl) {
  const token = authenticate(baseUrl);
  const products = listProducts(baseUrl, token);
  const id = products && products[0] && products[0].id;
  getProduct(baseUrl, token, id);
  sleep(1);
}
''')
write(c,'scenarios/journey.js','''import { baseUrl } from '../config/environment.js';
import { scenarios, thresholds } from '../profiles/smoke.js';
import { journey } from '../flows/journey.js';
export const options = { scenarios, thresholds };
export default function () { journey(baseUrl); }
''')
write(c,'README.md','''# Modular manual T1
Pré-requisito: k6 2.0.0. Sem dependências npm.
Em outro terminal: `cd ../shared-mock && node server.cjs` (Node 24.18.0).
Neste diretório: `k6 run --no-usage-report scenarios/journey.js`.
URL opcional: `k6 run -e BASE_URL=http://127.0.0.1:3333 scenarios/journey.js`.
Configuração, perfil, cenário, fluxo, operações e contratos em diretórios próprios.
''')
