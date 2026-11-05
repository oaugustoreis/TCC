import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { criacaoProfiles } from "../../profiles/pedidos/criacao.profiles.js";
import { criacaoFlow } from "../../flows/pedidos/criacao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct03: criacaoProfiles.ct03 },
};

export function criacaoScenario() {
    criacaoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    criacaoScenario();
}

export default engine;
