import { del } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function removeCartItem({ baseUrl, token, cartId, productId, stepPrefix }) {
    const r = del(`${baseUrl}/carts/${cartId}/items/${productId}`, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 200, label: `${stepPrefix} status` },
        fields: {
            id: { type: "string", minLength: 1, expected: cartId, label: bodyLabel },
            status: { expected: "open", label: bodyLabel },
            items: {
                type: "array",
                label: bodyLabel,
                predicate: (items) => Array.isArray(items) && items.length === 0,
            },
            total: { expected: 0, label: bodyLabel },
        },
    });
    return r;
}
