import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { carrinhoProfiles } from "../../profiles/carrinho/carrinho.profiles.js";
import { atualizacaoCarrinhoFlow } from "../../flows/carrinho/atualizacao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct09: carrinhoProfiles.ct09 },
};

export function atualizacaoCarrinhoScenario() {
    atualizacaoCarrinhoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    atualizacaoCarrinhoScenario();
}

export default engine;
