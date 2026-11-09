import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { pagamentosProfiles } from "../../profiles/pagamentos/pagamentos.profiles.js";
import { compraCompletaFlow } from "../../flows/pagamentos/compraCompleta.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct15: pagamentosProfiles.ct15 },
};

export function compraCompletaScenario() {
    compraCompletaFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    compraCompletaScenario();
}

export default engine;
