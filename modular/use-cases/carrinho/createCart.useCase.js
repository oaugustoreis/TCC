import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function createCart({ baseUrl, token, stepPrefix }) {
    const r = post(`${baseUrl}/carts`, {}, { token });
    const bodyLabel = `${stepPrefix} corpo`;
    checkResponse(r, {
        status: { expected: 201, label: `${stepPrefix} status` },
        fields: {
            id: { type: "string", minLength: 1, label: bodyLabel },
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
