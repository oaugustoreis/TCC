import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getOrder({
    baseUrl,
    token,
    orderId,
    expectedStatus,
    expectedProductId = "p1",
    expectedQuantity = 1,
    expectedCartId,
    expectedItems = [],
    expectedTotal = 0,
    stepPrefix,
    status,
    fields,
}) {
    const r = get(`${baseUrl}/orders/${orderId}`, { token });
    const bodyLabel = stepPrefix ? `${stepPrefix} corpo` : "pedido corresponde";
    const resolvedStatus = status || (stepPrefix
        ? { expected: 200, label: `${stepPrefix} status` }
        : { expected: 200, label: "consulta 200" });
    const resolvedFields = fields || (stepPrefix
        ? (expectedCartId
            ? {
                id: {
                    type: "string",
                    minLength: 1,
                    expected: orderId,
                    label: bodyLabel,
                },
                cartId: {
                    type: "string",
                    minLength: 1,
                    expected: expectedCartId,
                    label: bodyLabel,
                },
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
                status: { expected: expectedStatus, label: bodyLabel },
            }
            : {
                id: {
                    type: "string",
                    minLength: 1,
                    expected: orderId,
                    label: bodyLabel,
                },
                productId: { expected: expectedProductId, label: bodyLabel },
                quantity: { expected: expectedQuantity, label: bodyLabel },
                status: { expected: expectedStatus, label: bodyLabel },
            })
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
