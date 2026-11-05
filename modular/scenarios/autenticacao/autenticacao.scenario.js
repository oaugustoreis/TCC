import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { autenticacaoProfiles } from "../../profiles/autenticacao/autenticacao.profiles.js";
import { autenticacaoFlow } from "../../flows/autenticacao/autenticacao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct01: autenticacaoProfiles.ct01 },
};

export function autenticacaoScenario() {
    autenticacaoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    autenticacaoScenario();
}

export default engine;
