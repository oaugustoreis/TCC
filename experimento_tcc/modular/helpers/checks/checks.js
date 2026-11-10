import { check } from "k6";

function matchesField(value, rule) {
    if (Object.prototype.hasOwnProperty.call(rule, "expected") && value !== rule.expected) return false;
    if (rule.type === "array" && !Array.isArray(value)) return false;
    if (rule.type && rule.type !== "array" && typeof value !== rule.type) return false;
    if (rule.nonEmpty && (!Array.isArray(value) || value.length === 0)) return false;
    if (typeof rule.minLength === "number" && (typeof value !== "string" || value.length < rule.minLength)) return false;
    if (typeof rule.predicate === "function" && !rule.predicate(value)) return false;
    return true;
}

function fieldChecks(fields) {
    const groups = new Map();
    for (const [field, rule] of Object.entries(fields)) {
        const label = rule.label || field;
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push({ field, rule });
    }
    return Object.fromEntries([...groups].map(([label, rules]) => [
        label,
        (response) => rules.every(({ field, rule }) => matchesField(response.json(field), rule)),
    ]));
}

export function checkFields(response, fields) {
    return check(response, fieldChecks(fields));
}

export function checkResponse(response, { status, fields = {} }) {
    return check(response, {
        ...(status ? { [status.label]: (r) => r.status === status.expected } : {}),
        ...fieldChecks(fields),
    });
}
