import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { catalogoProfiles } from "../../profiles/catalogo/catalogo.profiles.js";
import { estoqueCatalogoFlow } from "../../flows/catalogo/estoque.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct07: catalogoProfiles.ct07 },
};

export function estoqueCatalogoScenario() {
    estoqueCatalogoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    estoqueCatalogoScenario();
}

export default engine;
