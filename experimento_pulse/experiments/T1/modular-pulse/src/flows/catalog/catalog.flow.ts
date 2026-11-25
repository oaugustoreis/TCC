import { ps } from '@pulse/core';
import { authenticate, listProducts, productDetails } from '@src/use-cases/catalog/getCatalog.useCase';
export function catalogFlow(baseUrl: string): void {
    const token = authenticate(baseUrl);
    const items = listProducts(baseUrl, token);
    const selectedId = items && items[0] && items[0].id;
    productDetails(baseUrl, token, selectedId);
    ps.sleep(1);
}
