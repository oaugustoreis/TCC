import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";
import { listOrders } from "../../use-cases/pedidos/listOrders.useCase.js";

export function listagemFiltradaFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-11 01" }).json("token");
    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
        stepPrefix: "CT-11 02",
    }).json("id");
    getOrder({
        baseUrl,
        token,
        orderId,
        expectedStatus: "created",
        stepPrefix: "CT-11 03",
    });
    listOrders({
        baseUrl,
        token,
        orderStatus: "created",
        expectedOrderId: orderId,
        stepPrefix: "CT-11 04",
    });
}
