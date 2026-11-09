import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createCart } from "../../use-cases/carrinho/createCart.useCase.js";
import { addCartItem } from "../../use-cases/carrinho/addCartItem.useCase.js";
import { getCart } from "../../use-cases/carrinho/getCart.useCase.js";

export function adicaoCarrinhoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-08 01" }).json("token");

    const cartId = createCart({
        baseUrl,
        token,
        stepPrefix: "CT-08 02",
    }).json("id");

    addCartItem({
        baseUrl,
        token,
        cartId,
        productId: "p1",
        quantity: 1,
        expectedUnitPrice: 100,
        expectedSubtotal: 100,
        expectedTotal: 100,
        stepPrefix: "CT-08 03",
    });

    getCart({
        baseUrl,
        token,
        cartId,
        expectedStatus: "open",
        expectedItems: [
            { productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 },
        ],
        expectedTotal: 100,
        stepPrefix: "CT-08 04",
    });
}
