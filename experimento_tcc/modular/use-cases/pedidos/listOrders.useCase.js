import { get } from "../../helpers/http/http.js";
import { checkResponse } from "../../helpers/checks/checks.js";

export function listOrders({
    baseUrl,
    token,
    orderStatus,
    expectedOrderId,
    expectedProductId = "p1",
    expectedQuantity = 1,
    stepPrefix,
    status,
    fields,
}) {
    const query = orderStatus ? `?status=${encodeURIComponent(orderStatus)}` : "";
    const r = get(`${baseUrl}/orders${query}`, { token });
    const resolvedStatus = status || {
        expected: 200,
        label: stepPrefix ? `${stepPrefix} status` : "pedidos 200",
    };
    const resolvedFields = fields || {
        items: {
            type: "array",
            label: stepPrefix ? `${stepPrefix} corpo` : "pedidos listados",
            predicate: (items) =>
                Array.isArray(items) &&
                items.length === 1 &&
                Boolean(items[0]) &&
                typeof expectedOrderId === "string" &&
                expectedOrderId.length > 0 &&
                items[0].id === expectedOrderId &&
                items[0].productId === expectedProductId &&
                items[0].quantity === expectedQuantity &&
                items[0].status === (orderStatus || "created"),
        },
    };
    checkResponse(r, {
        status: resolvedStatus,
        fields: resolvedFields,
    });
    return r;
}
