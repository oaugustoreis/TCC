import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, OPTIONS, CREDENTIALS } from '../shared/config.js';
export const options = OPTIONS;
export default function () {
  const EXPECTED_STATUS = 'created';
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify(CREDENTIALS), { headers: { 'Content-Type': 'application/json' } });
  check(login, { 'login 200': r => r.status === 200, 'token presente': r => typeof r.json('token') === 'string' });
  const token = login.json('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
