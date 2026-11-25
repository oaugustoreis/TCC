import { configResolver, Env } from '@pulse/config';
import { catalogFlow } from '@src/flows/catalog/catalog.flow';
export function setupCatalog(): { baseUrl: string } {
    const environment = configResolver.get('ENV', 'dev').toUpperCase();
    return { baseUrl: Env[`BASE_URL_${environment}`] || configResolver.get('BASE_URL', 'http://127.0.0.1:3333') };
}
export function catalogScenario(data: { baseUrl: string }): void {
    catalogFlow(data.baseUrl);
}
