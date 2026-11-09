import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function createOrder({
    baseUrl,
    token,
    orderPayload,
    stepPrefix,
    status,
    fields,
}) {
    const r = post(`${baseUrl}/orders`, orderPayload, { token });
    const resolvedStatus = status || (stepPrefix
        ? { expected: 201, label: `${stepPrefix} status` }
        : { expected: 201, label: "pedido 201" });
    const resolvedFields = fields || (stepPrefix
        ? {
            id: { type: "string", minLength: 1, label: `${stepPrefix} corpo` },
            productId: { expected: orderPayload.productId, label: `${stepPrefix} corpo` },
            quantity: { expected: orderPayload.quantity, label: `${stepPrefix} corpo` },
            status: { expected: "created", label: `${stepPrefix} corpo` },
        }
        : {
            id: { type: "string", label: "pedido criado" },
            status: { expected: "created", label: "pedido criado" },
        });
    checkResponse(r, {
        status: resolvedStatus,
        fields: resolvedFields,
    });
    return r;
}
