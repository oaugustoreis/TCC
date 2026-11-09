import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getOrder({
    baseUrl,
    token,
    orderId,
    expectedStatus,
    expectedProductId = "p1",
    expectedQuantity = 1,
    stepPrefix,
    status,
    fields,
}) {
    const r = get(`${baseUrl}/orders/${orderId}`, { token });
    const resolvedStatus = status || (stepPrefix
        ? { expected: 200, label: `${stepPrefix} status` }
        : { expected: 200, label: "consulta 200" });
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
            status: { expected: expectedStatus, label: `${stepPrefix} corpo` },
        }
        : {
            id: { expected: orderId, label: "pedido corresponde" },
            status: { expected: expectedStatus, label: "status esperado" },
        });
    checkResponse(r, {
        status: resolvedStatus,
        fields: resolvedFields,
    });
    return r;
}
