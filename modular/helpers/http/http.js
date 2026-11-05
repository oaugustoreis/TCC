import http from "k6/http";

function request(method, url, body, { token, headers = {}, ...params } = {}) {
    const requestHeaders = { "Content-Type": "application/json", ...headers };
    const hasAuthorization = Object.keys(headers).some(
        (name) => name.toLowerCase() === "authorization",
    );
    if (token && !hasAuthorization) {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    const isJsonBody = body !== null && typeof body === "object"
        && !(body instanceof ArrayBuffer) && !ArrayBuffer.isView(body);
    const payload = isJsonBody ? JSON.stringify(body) : body;

    return http.request(method, url, payload, {
        ...params,
        headers: requestHeaders,
    });
}

export function get(url, params = {}) {
    return request("GET", url, null, params);
}

export function post(url, body, params = {}) {
    return request("POST", url, body, params);
}

export function patch(url, body, params = {}) {
    return request("PATCH", url, body, params);
}
