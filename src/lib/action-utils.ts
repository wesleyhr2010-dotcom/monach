// ============================================
// Shared utilities for server actions
// ============================================

/**
 * Standard result type for all server actions.
 * Eliminates the need for repetitive try/catch + error formatting.
 */
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Wraps a server action in standardized error handling.
 * Replaces 15+ identical try/catch blocks across the codebase.
 *
 * @example
 * export async function createItem(name: string) {
 *   return safeAction(async () => {
 *     const item = await prisma.item.create({ data: { name } });
 *     return item.id;
 *   });
 * }
 */
export async function safeAction<T = void>(
    fn: () => Promise<T>
): Promise<ActionResult<T>> {
    try {
        const result = await fn();
        return { success: true, data: result };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: message };
    }
}

/**
 * Generates a URL-safe slug from a name string.
 * Handles accented characters (NFD normalization).
 * Used by: categories, resellers, and any future entities with slugs.
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Safely converts Prisma Decimal / BigInt / string to a JS number.
 * Returns null if the value is null/undefined.
 */
export function toNumber(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    return Number(val);
}
