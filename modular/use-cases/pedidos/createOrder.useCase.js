import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function createOrder({ baseUrl, token, orderPayload }) {
    const r = post(`${baseUrl}/orders`, orderPayload, { token });
    checkResponse(r, {
        status: { expected: 201, label: "pedido 201" },
        fields: {
            id: { type: "string", label: "pedido criado" },
            status: { expected: "created", label: "pedido criado" },
        },
    });
    return r;
}
