import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function login({ baseUrl, credentials }) {
    const r = post(`${baseUrl}/auth/login`, credentials);
    checkResponse(r, {
        status: { expected: 200, label: "login 200" },
        fields: {
            token: { type: "string", label: "token presente" },
        },
    });
    return r;
}
