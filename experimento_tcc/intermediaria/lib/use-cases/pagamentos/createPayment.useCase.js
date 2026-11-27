import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function createPayment({
    baseUrl,
    token,
    orderId,
    method,
    expectedAmount = 100,
    expectedStatus,
    stepPrefix,
}) {
    const r = post(`${baseUrl}/payments`, { orderId, method }, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 201, label: `${stepPrefix} status` },
        fields: {
            id: { type: "string", minLength: 1, label: bodyLabel },
            orderId: {
                type: "string",
                minLength: 1,
                expected: orderId,
                label: bodyLabel,
            },
            amount: { expected: expectedAmount, label: bodyLabel },
            status: { expected: expectedStatus, label: bodyLabel },
        },
    });
    return r;
}
