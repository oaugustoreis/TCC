import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { pagamentosProfiles } from "../../profiles/pagamentos/pagamentos.profiles.js";
import { aprovacaoPagamentoFlow } from "../../flows/pagamentos/aprovacao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct13: pagamentosProfiles.ct13 },
};

export function aprovacaoPagamentoScenario() {
    aprovacaoPagamentoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    aprovacaoPagamentoScenario();
}

export default engine;
