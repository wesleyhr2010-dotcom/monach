import { cache } from "react";
import { createSupabaseSSRClient } from "./supabase-ssr";
import { prisma } from "./prisma";
import { BusinessError } from "./action-utils";
import type { ActionResult } from "./action-utils";
import { setUserContext, clearUserContext } from "./sentry";

export type Role = "ADMIN" | "COLABORADORA" | "REVENDEDORA";

export type CurrentUser = {
    id: string;
    email: string | undefined;
    profileId: string | null;
    name: string;
    role: Role;
    isActive: boolean;
    colaboradoraId: string | null;
    rawUser: { id: string; email?: string };
};

const PROFILE_SELECT = {
    id: true,
    name: true,
    role: true,
    taxa_comissao: true,
    is_active: true,
    colaboradora_id: true,
} as const;

/** Busca o perfil no banco; retorna null se não encontrado ou se o DB falhar. */
async function resolveProfile(authUserId: string, email: string | null) {
    try {
        let profile = await prisma.reseller.findFirst({
            where: { auth_user_id: authUserId },
            select: PROFILE_SELECT,
        });

        if (!profile && email) {
            profile = await prisma.reseller.findFirst({
                where: { email, auth_user_id: null, role: "REVENDEDORA" },
                select: PROFILE_SELECT,
            });
            if (profile) {
                await prisma.reseller.update({
                    where: { id: profile.id },
                    data: { auth_user_id: authUserId },
                });
            }
        }

        return profile;
    } catch (err) {
        console.error("[getCurrentUser] DB error:", err instanceof Error ? err.message : String(err));
        return null;
    }
}

/**
 * Retorna o usuário autenticado com perfil do banco.
 * Envolvido com React.cache() para deduplicação por request —
 * chamadas múltiplas no mesmo render (layout + page + server actions)
 * executam apenas 1 query real ao Supabase + Prisma.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createSupabaseSSRClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const profile = await resolveProfile(user.id, user.email ?? null);

    // Se não há perfil no banco, não construir contexto com defaults permissivos.
    // Isso força requireAuth a rejeitar usuários não vinculados.
    if (!profile) {
        clearUserContext();
        return null;
    }

    setUserContext(profile.id, user.email);

    return {
        id: user.id,
        email: user.email,
        profileId: profile.id,
        name: profile.name || user.email?.split('@')[0] || "Utilizador",
        role: profile.role as Role,
        isActive: profile.is_active,
        colaboradoraId: profile.colaboradora_id || null,
        rawUser: user
    };
});

/**
 * Guard obrigatório para TODAS as Server Actions que acessam dados de usuário.
 * Segue a SPEC_SECURITY_RBAC.md — lança BUSINESS errors em vez de retornar null.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<CurrentUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new BusinessError("Sesión no válida. Inicia sesión nuevamente.");
    }

    if (!user.isActive) {
        throw new BusinessError("Tu cuenta no está activa. Contacta a tu consultora.");
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        throw new BusinessError("No tienes permiso para realizar esta acción.");
    }

    return user;
}

/**
 * ActionResult-safe variant of requireAuth.
 * Returns ActionResult<CurrentUser> instead of throwing.
 * Useful when the caller prefers explicit error handling over try/catch.
 */
export async function requireAuthSafe(allowedRoles?: Role[]): Promise<ActionResult<CurrentUser>> {
    try {
        const user = await requireAuth(allowedRoles);
        return { success: true, data: user };
    } catch (err: unknown) {
        const msg = err instanceof BusinessError ? err.message : "Error de autenticación";
        return { success: false, error: msg };
    }
}
