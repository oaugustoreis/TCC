import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";

export function consultaFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials }).json("token");
    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
    }).json("id");
    getOrder({ baseUrl, token, orderId, expectedStatus: "created" });
}
