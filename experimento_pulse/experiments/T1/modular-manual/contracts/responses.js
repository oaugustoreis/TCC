import { check } from 'k6';
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
