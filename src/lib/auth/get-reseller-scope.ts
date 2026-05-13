import type { CurrentUser } from "@/lib/user";

/**
 * Escopo WHERE para queries em `Reseller`.
 * `colaboradora_id` é campo direto no modelo Reseller.
 * Ref: docs/sistema/SPEC_SECURITY_RBAC.md §5
 */
export function getResellerScope(caller: CurrentUser): Record<string, unknown> {
    if (caller.role === "ADMIN") {
        return {};
    }
    if (caller.role === "COLABORADORA" && caller.profileId) {
        return { colaboradora_id: caller.profileId };
    }
    return { id: caller.profileId };
}

/**
 * Escopo WHERE para queries em `Maleta`.
 * Maleta não tem colaboradora_id direto — o vínculo é via relação reseller.
 * Ref: docs/sistema/SPEC_SECURITY_RBAC.md §5
 */
export function getMaletaScope(caller: CurrentUser): Record<string, unknown> {
    if (caller.role === "ADMIN") {
        return {};
    }
    if (caller.role === "COLABORADORA" && caller.profileId) {
        return { reseller: { colaboradora_id: caller.profileId } };
    }
    return { reseller_id: caller.profileId };
}
