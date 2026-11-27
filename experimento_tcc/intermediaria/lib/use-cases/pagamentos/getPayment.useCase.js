import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getPayment({
    baseUrl,
    token,
    paymentId,
    expectedOrderId,
    expectedAmount = 100,
    expectedStatus,
    stepPrefix,
}) {
    const r = get(`${baseUrl}/payments/${paymentId}`, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 200, label: `${stepPrefix} status` },
        fields: {
            id: {
                type: "string",
                minLength: 1,
                expected: paymentId,
                label: bodyLabel,
            },
            orderId: {
                type: "string",
                minLength: 1,
                expected: expectedOrderId,
                label: bodyLabel,
            },
            amount: { expected: expectedAmount, label: bodyLabel },
            status: { expected: expectedStatus, label: bodyLabel },
        },
    });
    return r;
}
