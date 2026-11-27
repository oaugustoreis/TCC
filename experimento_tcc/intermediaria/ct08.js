import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";
import { login } from "./lib/use-cases/autenticacao/login.useCase.js";
import { createCart } from "./lib/use-cases/carrinho/createCart.useCase.js";
import { addCartItem } from "./lib/use-cases/carrinho/addCartItem.useCase.js";
import { getCart } from "./lib/use-cases/carrinho/getCart.useCase.js";

export const options = OPTIONS;

export default function () {
    const baseUrl = BASE_URL;
    const credentials = CREDENTIALS;
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
