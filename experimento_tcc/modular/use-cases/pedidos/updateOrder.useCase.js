import { patch } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function updateOrder({
    baseUrl,
    token,
    orderId,
    status,
    expectedProductId = "p1",
    expectedQuantity = 1,
    expectedCartId,
    expectedItems = [],
    expectedTotal = 0,
    stepPrefix,
    statusCheck,
    fields,
}) {
    const r = patch(
        `${baseUrl}/orders/${orderId}/status`,
        { status },
        { token },
    );
    const bodyLabel = stepPrefix ? `${stepPrefix} corpo` : "status confirmado";
    const resolvedStatus = statusCheck || (stepPrefix
        ? { expected: 200, label: `${stepPrefix} status` }
        : { expected: 200, label: "atualização 200" });
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
                status: { expected: status, label: bodyLabel },
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
                status: { expected: status, label: bodyLabel },
            })
        : {
            status: { expected: status, label: "status confirmado" },
        });
    checkResponse(r, {
        status: resolvedStatus,
        fields: resolvedFields,
    });
    return r;
}
