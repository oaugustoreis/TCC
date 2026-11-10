import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { cancelamentoProfiles } from "../../profiles/pedidos/cancelamento.profiles.js";
import { cancelamentoFlow } from "../../flows/pedidos/cancelamento.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct12: cancelamentoProfiles.ct12 },
};

export function cancelamentoScenario() {
    cancelamentoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    cancelamentoScenario();
}

export default engine;
