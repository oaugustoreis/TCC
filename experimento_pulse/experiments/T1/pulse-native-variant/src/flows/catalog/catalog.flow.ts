import { ps } from '@pulse/core';
import { authenticate, listProducts, productDetails } from '@src/use-cases/catalog/getCatalog.useCase';
export function catalogFlow(baseUrl: string): void {
    ps.group('Catalog journey', () => {
        const token = authenticate(baseUrl);
        const products = listProducts(baseUrl, token);
        productDetails(baseUrl, token, products[0].id);
    });
    ps.sleep(1);
}
