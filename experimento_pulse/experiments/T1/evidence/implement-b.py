from instrument import write
c='modular-pulse'
write(c,'src/schemas/catalog/catalog.schema.ts','''import { ps } from '@pulse/core';
export function isProduct(data: any): boolean {
    return !!data && typeof data.id === 'number' &&
        typeof data.name === 'string' && data.name.length > 0 &&
        typeof data.price === 'number';
}
export function validateBody(response: any, label: string, contract: (data: any) => boolean): any {
    let data: any = null;
    try { data = response.json(); } catch (_) {}
    ps.check(data, { [label]: contract });
    return data;
}
''')
write(c,'src/use-cases/catalog/getCatalog.useCase.ts','''import { get, post } from '@pulse/http';
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
''')
write(c,'src/flows/catalog/catalog.flow.ts','''import { ps } from '@pulse/core';
import { authenticate, listProducts, productDetails } from '@src/use-cases/catalog/getCatalog.useCase';
export function catalogFlow(baseUrl: string): void {
    const token = authenticate(baseUrl);
    const items = listProducts(baseUrl, token);
    const selectedId = items && items[0] && items[0].id;
    productDetails(baseUrl, token, selectedId);
    ps.sleep(1);
}
''')
write(c,'src/profiles/catalog/catalog.profiles.ts','''import { Options } from 'k6/options';
export const catalogProfiles: Options['scenarios'] = {
    "catalog_smoke_test": {
        executor: 'constant-vus',
        exec: 'engine',
        vus: 1,
        duration: '10s',
    },
};
''')
write(c,'src/scenarios/catalog/catalog.scenario.ts','''import { Env } from '@pulse/config';
import { catalogFlow } from '@src/flows/catalog/catalog.flow';
export function setupCatalog(): { baseUrl: string } {
    return { baseUrl: Env.BASE_URL_DEV };
}
export function catalogScenario(data: { baseUrl: string }): void {
    catalogFlow(data.baseUrl);
}
''')
write(c,'src/scenarios/catalog/thresholds.ts','''export const thresholds = {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<1500'],
};
''')
write(c,'README.md','''# Modular Pulse T1
Pré-requisitos: Node 24.18.0, npm 11.16.0, k6 2.0.0; executar `npm ci`.
Mock independente: em outro terminal, `cd ../shared-mock && node server.cjs`.
CLI oficial fixada: `node ../evidence/cli/node_modules/pulse-arch/pulse/cli.js run catalog_smoke_test dev`.
Reinstalar essa CLI isolada se necessário: a partir de T1, `npm install --prefix evidence/cli --ignore-scripts --save-exact pulse-arch@1.3.9`.
O workspace foi gerado com init/gen catalog/add-env; os seis arquivos de catalog foram adaptados à especificação T1. Núcleo preservado. Diretórios sample-request, mock interno e GUI gerados permanecem, mas não são utilizados.
Pulse fornece descoberta, compilação, engine, HTTP, status checks e ps.check/sleep. Contratos customizados mantêm checks idênticos ao manual, sem checks extras da cadeia expect padrão.
''')
