import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function addCartItem({
    baseUrl,
    token,
    cartId,
    productId,
    quantity,
    expectedUnitPrice,
    expectedSubtotal,
    expectedTotal,
    stepPrefix,
}) {
    const r = post(
        `${baseUrl}/carts/${cartId}/items`,
        { productId, quantity },
        { token },
    );
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 201, label: `${stepPrefix} status` },
        fields: {
            id: { type: "string", minLength: 1, expected: cartId, label: bodyLabel },
            status: { expected: "open", label: bodyLabel },
            items: {
                type: "array",
                label: bodyLabel,
                predicate: (items) =>
                    Array.isArray(items) &&
                    items.length === 1 &&
                    Boolean(items[0]) &&
                    items[0].productId === productId &&
                    items[0].quantity === quantity &&
                    items[0].unitPrice === expectedUnitPrice &&
                    items[0].subtotal === expectedSubtotal,
            },
            total: { expected: expectedTotal, label: bodyLabel },
        },
    });
    return r;
}
