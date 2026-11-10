import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { getProduct } from "../../use-cases/catalogo/getProduct.useCase.js";
import { getProductStock } from "../../use-cases/catalogo/getProductStock.useCase.js";
import { createCart } from "../../use-cases/carrinho/createCart.useCase.js";
import { addCartItem } from "../../use-cases/carrinho/addCartItem.useCase.js";
import { getCart } from "../../use-cases/carrinho/getCart.useCase.js";
import { createOrder } from "../../use-cases/pedidos/createOrder.useCase.js";
import { updateOrder } from "../../use-cases/pedidos/updateOrder.useCase.js";
import { getOrder } from "../../use-cases/pedidos/getOrder.useCase.js";
import { createPayment } from "../../use-cases/pagamentos/createPayment.useCase.js";
import { getPayment } from "../../use-cases/pagamentos/getPayment.useCase.js";

export function compraCompletaFlow({ baseUrl, credentials }) {
    const expectedItems = [
        { productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 },
    ];

    const token = login({ baseUrl, credentials, stepPrefix: "CT-15 01" }).json("token");

    getProduct({
        baseUrl,
        token,
        productId: "p1",
        status: { expected: 200, label: "CT-15 02 status" },
        fields: {
            id: { expected: "p1", label: "CT-15 02 corpo" },
            name: { expected: "Produto A", label: "CT-15 02 corpo" },
            price: { expected: 100, label: "CT-15 02 corpo" },
            category: { expected: "principal", label: "CT-15 02 corpo" },
        },
    });

    getProductStock({
        baseUrl,
        token,
        productId: "p1",
        expectedQuantity: 10,
        expectedAvailable: true,
        stepPrefix: "CT-15 03",
    });

    const cartId = createCart({
        baseUrl,
        token,
        stepPrefix: "CT-15 04",
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
        stepPrefix: "CT-15 05",
    });

    getCart({
        baseUrl,
        token,
        cartId,
        expectedStatus: "open",
        expectedItems,
        expectedTotal: 100,
        stepPrefix: "CT-15 06",
    });

    const orderId = createOrder({
        baseUrl,
        token,
        orderPayload: { cartId },
        expectedItems,
        expectedTotal: 100,
        stepPrefix: "CT-15 07",
    }).json("id");

    updateOrder({
        baseUrl,
        token,
        orderId,
        status: "confirmed",
        expectedCartId: cartId,
        expectedItems,
        expectedTotal: 100,
        stepPrefix: "CT-15 08",
    });

    const paymentId = createPayment({
        baseUrl,
        token,
        orderId,
        method: "test_approved",
        expectedAmount: 100,
        expectedStatus: "approved",
        stepPrefix: "CT-15 09",
    }).json("id");

    getPayment({
        baseUrl,
        token,
        paymentId,
        expectedOrderId: orderId,
        expectedAmount: 100,
        expectedStatus: "approved",
        stepPrefix: "CT-15 10",
    });

    getOrder({
        baseUrl,
        token,
        orderId,
        expectedStatus: "paid",
        expectedCartId: cartId,
        expectedItems,
        expectedTotal: 100,
        stepPrefix: "CT-15 11",
    });

    getCart({
        baseUrl,
        token,
        cartId,
        expectedStatus: "checked_out",
        expectedItems,
        expectedTotal: 100,
        stepPrefix: "CT-15 12",
    });
}
