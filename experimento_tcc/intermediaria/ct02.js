import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";
import { login } from "./lib/use-cases/autenticacao/login.useCase.js";
import { listProducts } from "./lib/use-cases/catalogo/listProducts.useCase.js";
import { getProduct } from "./lib/use-cases/catalogo/getProduct.useCase.js";

export const options = OPTIONS;

export default function () {
    const baseUrl = BASE_URL;
    const credentials = CREDENTIALS;
    const token = login({ baseUrl, credentials }).json("token");
    listProducts({ baseUrl, token });
    getProduct({ baseUrl, token, productId: "p1" });
}
