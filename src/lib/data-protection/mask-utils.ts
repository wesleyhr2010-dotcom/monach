// ============================================
// Máscara de dados sensíveis para exibição na UI
// Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md §6
// ============================================

/**
 * Mascara alias Bancard (equivalente PIX paraguaio).
 * Ex: "mi.alias" → "mi****as"
 */
export function maskAlias(value: string): string {
    if (!value || value.length <= 4) return "****";
    return value.slice(0, 2) + "****" + value.slice(-2);
}

/**
 * Mascara número de conta bancária.
 * Ex: "1234567890" → "•••• 7890"
 */
export function maskCuenta(value: string): string {
    if (!value || value.length === 0) return "•••• ••••";
    return "•••• " + value.slice(-4);
}

/**
 * Mascara CI/RUC paraguaio.
 * Ex: "1234567" → "••••••7"
 */
export function maskCI(value: string): string {
    if (!value || value.length === 0) return "•••••••";
    return "•".repeat(Math.max(0, value.length - 1)) + value.slice(-1);
}

/**
 * Mascara email — mostra apenas primeiro e último caractere antes do @.
 * Ex: "maria@gmail.com" → "m***a@gmail.com"
 */
export function maskEmail(value: string): string {
    if (!value || !value.includes("@")) return value;
    const [local, domain] = value.split("@");
    if (local.length <= 2) return "*@" + domain;
    return local[0] + "***" + local[local.length - 1] + "@" + domain;
}

/**
 * Mascara número de WhatsApp — mostra apenas os últimos 4 dígitos.
 * Ex: "+595981234567" → "••••••••••4567"
 */
export function maskWhatsApp(value: string): string {
    if (!value || value.length < 4) return "••••";
    const digits = value.replace(/\D/g, "");
    if (digits.length < 4) return "••••";
    return "•".repeat(digits.length - 4) + digits.slice(-4);
}
