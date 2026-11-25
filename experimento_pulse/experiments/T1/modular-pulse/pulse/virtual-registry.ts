// AUTO-GENERATED FILE - DO NOT EDIT
import * as catalogScenario from '../src/scenarios/catalog/catalog.scenario';
import { catalogProfiles } from '../src/profiles/catalog/catalog.profiles';
import { thresholds as catalogThresholds } from '../src/scenarios/catalog/thresholds';

export const registry: any = {
    ...Object.keys(catalogProfiles || {}).reduce((acc: any, key) => {
        acc[key] = {
            profile: (catalogProfiles as any)[key],
            setup: catalogScenario.setupCatalog,
            scenarioFunc: catalogScenario.catalogScenario,
            thresholds: catalogThresholds,
        };
        return acc;
    }, {}),
};
