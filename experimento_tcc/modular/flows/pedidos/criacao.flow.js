import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { getProduct } from "../../use-cases/catalogo/getProduct.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";

export function criacaoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials }).json("token");
    getProduct({ baseUrl, token, productId: "p1" });
    createOrder({
        baseUrl,
        token,
        orderPayload: { productId: "p1", quantity: 1 },
    });
}
