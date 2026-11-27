import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";
import { login } from "./lib/use-cases/autenticacao/login.useCase.js";
import { createOrder } from "./lib/use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "./lib/use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "./lib/use-cases/pedidos/getOrder.useCase.js";
import { createPayment } from "./lib/use-cases/pagamentos/createPayment.useCase.js";
import { getPayment } from "./lib/use-cases/pagamentos/getPayment.useCase.js";

export const options = OPTIONS;

export default function () {
    const baseUrl = BASE_URL;
    const credentials = CREDENTIALS;
    const token = login({ baseUrl, credentials, stepPrefix: "CT-13 01" }).json("token");

    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
        stepPrefix: "CT-13 02",
    }).json("id");

    updateOrder({
        baseUrl,
        token,
        orderId,
        status: "confirmed",
        stepPrefix: "CT-13 03",
    });

    const paymentId = createPayment({
        baseUrl,
        token,
        orderId,
        method: "test_approved",
        expectedAmount: 100,
        expectedStatus: "approved",
        stepPrefix: "CT-13 04",
    }).json("id");

    getPayment({
        baseUrl,
        token,
        paymentId,
        expectedOrderId: orderId,
        expectedAmount: 100,
        expectedStatus: "approved",
        stepPrefix: "CT-13 05",
    });

    getOrder({
        baseUrl,
        token,
        orderId,
        expectedStatus: "paid",
        stepPrefix: "CT-13 06",
    });
}
