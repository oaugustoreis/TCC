import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function createOrder({
    baseUrl,
    token,
    orderPayload,
    expectedItems = [],
    expectedTotal = 0,
    stepPrefix,
    status,
    fields,
}) {
    const r = post(`${baseUrl}/orders`, orderPayload, { token });
    const bodyLabel = stepPrefix ? `${stepPrefix} corpo` : "pedido criado";
    const resolvedStatus = status || (stepPrefix
        ? { expected: 201, label: `${stepPrefix} status` }
        : { expected: 201, label: "pedido 201" });
    const resolvedFields = fields || (stepPrefix
        ? (orderPayload.cartId
            ? {
                id: { type: "string", minLength: 1, label: bodyLabel },
                cartId: {
                    type: "string",
                    minLength: 1,
                    expected: orderPayload.cartId,
                    label: bodyLabel,
                },
                status: { expected: "created", label: bodyLabel },
                items: {
                    type: "array",
                    label: bodyLabel,
                    predicate: (items) =>
                        Array.isArray(items) &&
                        items.length === expectedItems.length &&
                        expectedItems.every(
                            (expected, idx) =>
                                Boolean(items[idx]) &&
                                items[idx].productId === expected.productId &&
                                items[idx].quantity === expected.quantity &&
                                items[idx].unitPrice === expected.unitPrice &&
                                items[idx].subtotal === expected.subtotal,
                        ),
                },
                total: { expected: expectedTotal, label: bodyLabel },
            }
            : {
                id: { type: "string", minLength: 1, label: bodyLabel },
                productId: { expected: orderPayload.productId, label: bodyLabel },
                quantity: { expected: orderPayload.quantity, label: bodyLabel },
                status: { expected: "created", label: bodyLabel },
            })
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
