import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function listProducts({ baseUrl, token, category, status, fields }) {
    const url = category ? `${baseUrl}/products?category=${category}` : `${baseUrl}/products`;
    const r = get(url, { token });
    checkResponse(r, {
        status: status || { expected: 200, label: "lista 200" },
        fields: fields || {
            items: {
                type: "array",
                nonEmpty: true,
                label: "produtos disponíveis",
            },
        },
    });
    return r;
}
