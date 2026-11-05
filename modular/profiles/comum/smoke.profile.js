import { OPTIONS } from "../../../shared/config.js";

export const smokeProfile = {
    executor: "shared-iterations",
    exec: "engine",
    vus: OPTIONS.vus,
    iterations: OPTIONS.iterations,
};
