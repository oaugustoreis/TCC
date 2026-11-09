import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "../../use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";
import { createPayment } from "../../use-cases/pagamentos/createPayment.useCase.js";
import { getPayment } from "../../use-cases/pagamentos/getPayment.useCase.js";

export function aprovacaoPagamentoFlow({ baseUrl, credentials }) {
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
