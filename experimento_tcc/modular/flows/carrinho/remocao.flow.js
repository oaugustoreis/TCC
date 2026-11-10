import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createCart } from "../../use-cases/carrinho/createCart.useCase.js";
import { addCartItem } from "../../use-cases/carrinho/addCartItem.useCase.js";
import { removeCartItem } from "../../use-cases/carrinho/removeCartItem.useCase.js";
import { getCart } from "../../use-cases/carrinho/getCart.useCase.js";

export function remocaoCarrinhoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-10 01" }).json("token");

    const cartId = createCart({
        baseUrl,
        token,
        stepPrefix: "CT-10 02",
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
        stepPrefix: "CT-10 03",
    });

    removeCartItem({
        baseUrl,
        token,
        cartId,
        productId: "p1",
        stepPrefix: "CT-10 04",
    });

    getCart({
        baseUrl,
        token,
        cartId,
        expectedStatus: "open",
        expectedItems: [],
        expectedTotal: 0,
        stepPrefix: "CT-10 05",
    });
}
