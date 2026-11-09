import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "../../use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";
import { createPayment } from "../../use-cases/pagamentos/createPayment.useCase.js";
import { getPayment } from "../../use-cases/pagamentos/getPayment.useCase.js";

export function recusaPagamentoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-14 01" }).json("token");

    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
        stepPrefix: "CT-14 02",
    }).json("id");

    updateOrder({
        baseUrl,
        token,
        orderId,
        status: "confirmed",
        stepPrefix: "CT-14 03",
    });

    const paymentId = createPayment({
        baseUrl,
        token,
        orderId,
        method: "test_declined",
        expectedAmount: 100,
        expectedStatus: "declined",
        stepPrefix: "CT-14 04",
    }).json("id");

    getPayment({
        baseUrl,
        token,
        paymentId,
        expectedOrderId: orderId,
        expectedAmount: 100,
        expectedStatus: "declined",
        stepPrefix: "CT-14 05",
    });

    getOrder({
        baseUrl,
        token,
        orderId,
        expectedStatus: "confirmed",
        stepPrefix: "CT-14 06",
    });
}
