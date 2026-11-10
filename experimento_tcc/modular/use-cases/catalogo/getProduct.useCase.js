import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getProduct({ baseUrl, token, productId, status, fields }) {
    const r = get(`${baseUrl}/products/${productId}`, { token });
    checkResponse(r, {
        status: status || { expected: 200, label: "produto 200" },
        fields: fields || {
            id: { expected: productId, label: `produto ${productId}` },
        },
    });
    return r;
}
