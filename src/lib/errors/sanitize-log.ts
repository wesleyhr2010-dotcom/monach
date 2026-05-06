// ============================================
// Sanitização de logs — nunca vazar PII
// Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md §4
// ============================================

const SENSITIVE_FIELDS = [
    "password",
    "senha",
    "alias_ci_ruc",
    "ci_ruc",
    "cuenta",
    "alias_valor",
    "email",
    "whatsapp",
    "name",
    "nome",
    "endereco",
    "cpf",
    "rg",
    "token",
    "secret",
    "api_key",
    "authorization",
    "cookie",
    "phone",
    "telefone",
    "address",
    "direccion",
    "ruc",
    "passport",
    "birthdate",
    "fecha_nacimiento",
];

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== "object") return obj;
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            const isSensitive = SENSITIVE_FIELDS.some((f) =>
                key.toLowerCase().includes(f)
            );
            if (isSensitive) return [key, "[REDACTED]"];
            if (typeof value === "object" && value !== null) {
                return [key, sanitizeForLog(value as Record<string, unknown>)];
            }
            return [key, value];
        })
    );
}

import { logger } from "../logger";

/**
 * Wrapper seguro para console.error que sanitiza objetos automaticamente.
 */
export function safeLogError(
    prefix: string,
    payload: Record<string, unknown>
): void {
    logger.error(prefix, sanitizeForLog(payload));
}
