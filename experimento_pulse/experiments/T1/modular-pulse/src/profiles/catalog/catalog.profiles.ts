import { Options } from 'k6/options';
export const catalogProfiles: Options['scenarios'] = {
    "catalog_smoke_test": {
        executor: 'constant-vus',
        exec: 'engine',
        vus: 1,
        duration: '10s',
    },
};
