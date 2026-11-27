import { BASE_URL, CREDENTIALS, OPTIONS } from "../shared/config.js";
import { login } from "./lib/use-cases/autenticacao/login.useCase.js";

export const options = OPTIONS;

export default function () {
    const baseUrl = BASE_URL;
    const credentials = CREDENTIALS;
    login({ baseUrl, credentials });
}
