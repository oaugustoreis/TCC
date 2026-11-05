import { patch } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function updateOrder({ baseUrl, token, orderId, status }) {
    const r = patch(
        `${baseUrl}/orders/${orderId}/status`,
        { status },
        { token },
    );
    checkResponse(r, {
        status: { expected: 200, label: "atualização 200" },
        fields: {
            status: { expected: status, label: "status confirmado" },
        },
    });
    return r;
}
