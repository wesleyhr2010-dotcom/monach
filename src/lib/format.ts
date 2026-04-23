// ============================================
// Formatadores utilitários — Monarca
// ============================================

/**
 * Formata valor em Guaraníes paraguaios (G$).
 * Ex: 1850000 → "G$ 1.850.000"
 */
export function formatGs(value: number | Decimal | null | undefined): string {
    if (value == null) return "G$ 0";
    const num = typeof value === "object" && "toNumber" in value ? value.toNumber() : Number(value);
    if (isNaN(num)) return "G$ 0";
    return "G$ " + num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

/**
 * Formata valor abreviado em milhões/milhares.
 * Ex: 18500000 → "G$ 18.5M"  |  968000 → "G$ 968K"
 */
export function formatGsCompact(value: number | Decimal | null | undefined): string {
    if (value == null) return "G$ 0";
    const num = typeof value === "object" && "toNumber" in value ? value.toNumber() : Number(value);
    if (isNaN(num)) return "G$ 0";
    if (num >= 1_000_000) return "G$ " + (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return "G$ " + (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return "G$ " + num.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

/**
 * Formata percentual.
 * Ex: 10.5 → "10.5%"
 */
export function formatPct(value: number | Decimal | null | undefined): string {
    if (value == null) return "0%";
    const num = typeof value === "object" && "toNumber" in value ? value.toNumber() : Number(value);
    if (isNaN(num)) return "0%";
    return num.toFixed(1).replace(/\.0$/, "") + "%";
}

/**
 * Formata data curta.
 * Ex: "2024-12-15" → "15/12/2024"
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Formata data com mês por extenso.
 * Ex: "2024-12-15" → "15 dez. 2024"
 */
export function formatDateMonth(date: Date | string | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Formata telefone/WhatsApp para exibição.
 * Ex: "+595981234567" → "+595 981 234 567"
 */
export function formatPhone(value: string | null | undefined): string {
    if (!value) return "—";
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("595")) {
        return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Decimal = { toNumber(): number };
