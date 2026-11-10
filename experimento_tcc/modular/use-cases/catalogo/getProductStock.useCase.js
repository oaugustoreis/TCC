import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getProductStock({ baseUrl, token, productId, expectedQuantity, expectedAvailable, stepPrefix }) {
    const r = get(`${baseUrl}/products/${productId}/stock`, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 200, label: `${stepPrefix} status` },
        fields: {
            productId: { expected: productId, label: bodyLabel },
            quantity: { expected: expectedQuantity, label: bodyLabel },
            available: { expected: expectedAvailable, label: bodyLabel },
        },
    });
    return r;
}
