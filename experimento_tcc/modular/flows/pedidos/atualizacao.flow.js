import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "../../use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";

export function atualizacaoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials }).json("token");
    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
    }).json("id");
    updateOrder({ baseUrl, token, orderId, status: "confirmed" });
    getOrder({ baseUrl, token, orderId, expectedStatus: "confirmed" });
}
