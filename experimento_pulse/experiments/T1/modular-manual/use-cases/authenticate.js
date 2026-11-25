import http from 'k6/http';
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
