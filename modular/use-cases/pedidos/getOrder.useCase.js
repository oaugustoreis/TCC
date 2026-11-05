import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function getOrder({ baseUrl, token, orderId, expectedStatus }) {
    const r = get(`${baseUrl}/orders/${orderId}`, { token });
    checkResponse(r, {
        status: { expected: 200, label: "consulta 200" },
        fields: {
            id: { expected: orderId, label: "pedido corresponde" },
            status: { expected: expectedStatus, label: "status esperado" },
        },
    });
    return r;
}
