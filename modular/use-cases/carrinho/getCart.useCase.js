import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getCart({
    baseUrl,
    token,
    cartId,
    expectedStatus = "open",
    expectedItems = [],
    expectedTotal = 0,
    stepPrefix,
}) {
    const r = get(`${baseUrl}/carts/${cartId}`, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 200, label: `${stepPrefix} status` },
        fields: {
            id: { type: "string", minLength: 1, expected: cartId, label: bodyLabel },
            status: { expected: expectedStatus, label: bodyLabel },
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
        },
    });
    return r;
}
