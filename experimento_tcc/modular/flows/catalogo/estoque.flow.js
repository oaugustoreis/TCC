import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { getProductStock } from "../../use-cases/catalogo/getProductStock.useCase.js";

export function estoqueCatalogoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-07 01" }).json("token");

    getProductStock({
        baseUrl,
        token,
        productId: "p1",
        expectedQuantity: 10,
        expectedAvailable: true,
        stepPrefix: "CT-07 02",
    });

    getProductStock({
        baseUrl,
        token,
        productId: "p2",
        expectedQuantity: 0,
        expectedAvailable: false,
        stepPrefix: "CT-07 03",
    });
}
