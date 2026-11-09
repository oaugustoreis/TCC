import { login } from "../../use-cases/autenticacao/login.useCase.js";
import { listProducts } from "../../use-cases/catalogo/listProducts.useCase.js";
import { getProduct } from "../../use-cases/catalogo/getProduct.useCase.js";

export function filtroCatalogoFlow({ baseUrl, credentials }) {
    const token = login({ baseUrl, credentials, stepPrefix: "CT-06 01" }).json("token");

    const listRes = listProducts({
        baseUrl,
        token,
        category: "principal",
        status: { expected: 200, label: "CT-06 02 status" },
        fields: {
            items: {
                type: "array",
                label: "CT-06 02 corpo",
                predicate: (items) =>
                    Array.isArray(items) &&
                    items.length === 1 &&
                    Boolean(items[0]) &&
                    items[0].id === "p1" &&
                    items[0].name === "Produto A" &&
                    items[0].price === 100 &&
                    items[0].category === "principal",
            },
        },
    });

    const items = listRes.json("items");
    const listedItem = Array.isArray(items) && items.length === 1 ? items[0] : null;

    getProduct({
        baseUrl,
        token,
        productId: "p1",
        status: { expected: 200, label: "CT-06 03 status" },
        fields: {
            id: {
                expected: "p1",
                label: "CT-06 03 corpo",
                predicate: (val) => Boolean(listedItem && val === listedItem.id),
            },
            name: {
                expected: "Produto A",
                label: "CT-06 03 corpo",
                predicate: (val) => Boolean(listedItem && val === listedItem.name),
            },
            price: {
                expected: 100,
                label: "CT-06 03 corpo",
                predicate: (val) => Boolean(listedItem && val === listedItem.price),
            },
            category: {
                expected: "principal",
                label: "CT-06 03 corpo",
                predicate: (val) => Boolean(listedItem && val === listedItem.category),
            },
        },
    });
}
