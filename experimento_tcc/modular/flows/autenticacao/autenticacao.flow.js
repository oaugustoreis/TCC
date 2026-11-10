import { login } from "../../use-cases/autenticacao/login.useCase.js";

export function autenticacaoFlow({ baseUrl, credentials }) {
    login({ baseUrl, credentials });
}
