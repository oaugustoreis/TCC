import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { pagamentosProfiles } from "../../profiles/pagamentos/pagamentos.profiles.js";
import { recusaPagamentoFlow } from "../../flows/pagamentos/recusa.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct14: pagamentosProfiles.ct14 },
};

export function recusaPagamentoScenario() {
    recusaPagamentoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    recusaPagamentoScenario();
}

export default engine;
