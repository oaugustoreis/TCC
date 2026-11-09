import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { listagemFiltradaProfiles } from "../../profiles/pedidos/listagemFiltrada.profiles.js";
import { listagemFiltradaFlow } from "../../flows/pedidos/listagemFiltrada.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct11: listagemFiltradaProfiles.ct11 },
};

export function listagemFiltradaScenario() {
    listagemFiltradaFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    listagemFiltradaScenario();
}

export default engine;
