import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { listProducts } from "../../use-cases/catalogo/listProducts.useCase.js";
import { getProduct } from "../../use-cases/catalogo/getProduct.useCase.js";

export function catalogoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials }).json("token");
    listProducts({ baseUrl, token });
    getProduct({ baseUrl, token, productId: "p1" });
}
