import { Env } from '@pulse/config';
import { catalogFlow } from '@src/flows/catalog/catalog.flow';
export function setupCatalog(): { baseUrl: string } {
    return { baseUrl: Env.BASE_URL_DEV };
}
export function catalogScenario(data: { baseUrl: string }): void {
    catalogFlow(data.baseUrl);
}
