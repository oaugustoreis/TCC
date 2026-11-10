import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { consultaProfiles } from "../../profiles/pedidos/consulta.profiles.js";
import { consultaFlow } from "../../flows/pedidos/consulta.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct04: consultaProfiles.ct04 },
};

export function consultaScenario() {
    consultaFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    consultaScenario();
}

export default engine;
