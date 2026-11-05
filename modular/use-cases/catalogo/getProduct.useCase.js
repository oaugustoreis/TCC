import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getProduct({ baseUrl, token, productId }) {
    const r = get(`${baseUrl}/products/${productId}`, { token });
    checkResponse(r, {
        status: { expected: 200, label: "produto 200" },
        fields: {
            id: { expected: productId, label: `produto ${productId}` },
        },
    });
    return r;
}
