import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";
import { login } from "./lib/use-cases/autenticacao/login.useCase.js";
import { createOrder } from "./lib/use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "./lib/use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "./lib/use-cases/pedidos/getOrder.useCase.js";

export const options = OPTIONS;

export default function () {
    const baseUrl = BASE_URL;
    const credentials = CREDENTIALS;
    const token = login({ baseUrl, credentials, stepPrefix: "CT-12 01" }).json("token");
    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
        stepPrefix: "CT-12 02",
    }).json("id");
    updateOrder({
        baseUrl,
        token,
        orderId,
        status: "cancelled",
        stepPrefix: "CT-12 03",
    });
    getOrder({
        baseUrl,
        token,
        orderId,
        expectedStatus: "cancelled",
        stepPrefix: "CT-12 04",
    });
}
