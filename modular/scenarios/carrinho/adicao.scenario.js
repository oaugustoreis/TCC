import { BASE_URL, CREDENTIALS, OPTIONS } from "../../../shared/config.js";
import { carrinhoProfiles } from "../../profiles/carrinho/carrinho.profiles.js";
import { adicaoCarrinhoFlow } from "../../flows/carrinho/adicao.flow.js";

export const options = {
    thresholds: OPTIONS.thresholds,
    scenarios: { ct08: carrinhoProfiles.ct08 },
};

export function adicaoCarrinhoScenario() {
    adicaoCarrinhoFlow({ baseUrl: BASE_URL, credentials: CREDENTIALS });
}

export function engine() {
    adicaoCarrinhoScenario();
}

export default engine;
