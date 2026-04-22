import type { CurrentUser } from "@/lib/user";

/**
 * Retorna um filtro WHERE de escopo baseado na role do caller.
 * Útil para queries que listam dados de revendedoras/maletas.
 *
 * Ref: docs/sistema/SPEC_SECURITY_RBAC.md §5
 */
export function getResellerScope(caller: CurrentUser): Record<string, unknown> {
    if (caller.role === "ADMIN") {
        return {}; // Sem filtro — vê tudo
    }
    if (caller.role === "COLABORADORA" && caller.profileId) {
        return { colaboradora_id: caller.profileId }; // Apenas suas revendedoras
    }
    return { id: caller.profileId }; // Apenas ela mesma
}
