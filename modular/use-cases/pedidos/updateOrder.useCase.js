import { patch } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function updateOrder({
    baseUrl,
    token,
    orderId,
    status,
    expectedProductId = "p1",
    expectedQuantity = 1,
    stepPrefix,
    statusCheck,
    fields,
}) {
    const r = patch(
        `${baseUrl}/orders/${orderId}/status`,
        { status },
        { token },
    );
    const resolvedStatus = statusCheck || (stepPrefix
        ? { expected: 200, label: `${stepPrefix} status` }
        : { expected: 200, label: "atualização 200" });
    const resolvedFields = fields || (stepPrefix
        ? {
            id: {
                type: "string",
                minLength: 1,
                expected: orderId,
                label: `${stepPrefix} corpo`,
            },
            productId: { expected: expectedProductId, label: `${stepPrefix} corpo` },
            quantity: { expected: expectedQuantity, label: `${stepPrefix} corpo` },
            status: { expected: status, label: `${stepPrefix} corpo` },
        }
        : {
            status: { expected: status, label: "status confirmado" },
        });
    checkResponse(r, {
        status: resolvedStatus,
        fields: resolvedFields,
    });
    return r;
}
