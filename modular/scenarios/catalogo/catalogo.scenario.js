import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { catalogoProfiles } from "../../profiles/catalogo/catalogo.profiles.js";
import { catalogoFlow } from "../../flows/catalogo/catalogo.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct02: catalogoProfiles.ct02 },
};

export function catalogoScenario() {
    catalogoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    catalogoScenario();
}

export default engine;
