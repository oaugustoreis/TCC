import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function listProducts({ baseUrl, token }) {
    const r = get(`${baseUrl}/products`, { token });
    checkResponse(r, {
        status: { expected: 200, label: "lista 200" },
        fields: {
            items: {
                type: "array",
                nonEmpty: true,
                label: "produtos disponíveis",
            },
        },
    });
    return r;
}
