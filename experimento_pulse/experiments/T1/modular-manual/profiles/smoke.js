export const scenarios = {
  journey: { executor: 'constant-vus', vus: 1, duration: '10s' },
};
export const thresholds = {
  checks: ['rate==1'],
  http_req_failed: ['rate==0'],
  http_req_duration: ['p(95)<1500'],
};
