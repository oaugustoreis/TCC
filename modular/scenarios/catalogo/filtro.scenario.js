import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { catalogoProfiles } from "../../profiles/catalogo/catalogo.profiles.js";
import { filtroCatalogoFlow } from "../../flows/catalogo/filtro.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct06: catalogoProfiles.ct06 },
};

export function filtroCatalogoScenario() {
    filtroCatalogoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    filtroCatalogoScenario();
}

export default engine;
