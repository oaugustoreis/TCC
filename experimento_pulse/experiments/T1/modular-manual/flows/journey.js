import { sleep } from 'k6';
import { authenticate } from '../use-cases/authenticate.js';
import { listProducts, getProduct } from '../use-cases/products.js';
export function journey(baseUrl) {
  const token = authenticate(baseUrl);
  const products = listProducts(baseUrl, token);
  const id = products && products[0] && products[0].id;
  getProduct(baseUrl, token, id);
  sleep(1);
}
