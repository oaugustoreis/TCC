import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { atualizacaoProfiles } from "../../profiles/pedidos/atualizacao.profiles.js";
import { atualizacaoFlow } from "../../flows/pedidos/atualizacao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct05: atualizacaoProfiles.ct05 },
};

export function atualizacaoScenario() {
    atualizacaoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    atualizacaoScenario();
}

export default engine;
