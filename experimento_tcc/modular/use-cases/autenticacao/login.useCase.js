import { post } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function login({ baseUrl, credentials, stepPrefix }) {
    const r = post(`${baseUrl}/auth/login`, credentials);
    if (stepPrefix) {
        checkResponse(r, {
            status: { expected: 200, label: `${stepPrefix} status` },
            fields: {
                token: { type: "string", minLength: 1, label: `${stepPrefix} corpo` },
                tokenType: { expected: "Bearer", label: `${stepPrefix} corpo` },
            },
        });
    } else {
        checkResponse(r, {
            status: { expected: 200, label: "login 200" },
            fields: {
                token: { type: "string", label: "token presente" },
            },
        });
    }
    return r;
}
