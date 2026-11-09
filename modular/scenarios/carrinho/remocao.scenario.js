import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { carrinhoProfiles } from "../../profiles/carrinho/carrinho.profiles.js";
import { remocaoCarrinhoFlow } from "../../flows/carrinho/remocao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct10: carrinhoProfiles.ct10 },
};

export function remocaoCarrinhoScenario() {
    remocaoCarrinhoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    remocaoCarrinhoScenario();
}

export default engine;
