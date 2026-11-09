import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { createCart } from "../../use-cases/carrinho/createCart.useCase.js";
import { addCartItem } from "../../use-cases/carrinho/addCartItem.useCase.js";
import { updateCartItem } from "../../use-cases/carrinho/updateCartItem.useCase.js";
import { getCart } from "../../use-cases/carrinho/getCart.useCase.js";

export function atualizacaoCarrinhoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-09 01" }).json("token");

    const cartId = createCart({
        baseUrl,
        token,
        stepPrefix: "CT-09 02",
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
        stepPrefix: "CT-09 03",
    });

    updateCartItem({
        baseUrl,
        token,
        cartId,
        productId: "p1",
        quantity: 3,
        expectedUnitPrice: 100,
        expectedSubtotal: 300,
        expectedTotal: 300,
        stepPrefix: "CT-09 04",
    });

    getCart({
        baseUrl,
        token,
        cartId,
        expectedStatus: "open",
        expectedItems: [
            { productId: "p1", quantity: 3, unitPrice: 100, subtotal: 300 },
        ],
        expectedTotal: 300,
        stepPrefix: "CT-09 05",
    });
}
