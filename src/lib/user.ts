import { createSupabaseSSRClient } from "./supabase-ssr";
import { prisma } from "./prisma";
import type { Reseller } from "@/generated/prisma/client";

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

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createSupabaseSSRClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    // 1. Tentar encontrar pela auth_user_id (caminho normal)
    let profile = await prisma.reseller.findFirst({
        where: { auth_user_id: user.id },
        select: {
            id: true,
            name: true,
            role: true,
            taxa_comissao: true,
            is_active: true,
            colaboradora_id: true,
        }
    });

    // 2. Fallback: buscar por email e auto-vincular auth_user_id
    // SEGURANÇA: apenas revendedoras podem ser auto-vinculadas.
    // ADMIN/COLABORADORA exigem processo explícito de vinculação por outro ADMIN.
    if (!profile && user.email) {
        profile = await prisma.reseller.findFirst({
            where: { email: user.email, auth_user_id: null, role: "REVENDEDORA" },
            select: {
                id: true,
                name: true,
                role: true,
                taxa_comissao: true,
                is_active: true,
                colaboradora_id: true,
            }
        });

        if (profile) {
            // Auto-vincular para futuros logins
            await prisma.reseller.update({
                where: { id: profile.id },
                data: { auth_user_id: user.id }
            });
        }
    }

    // Se não há perfil no banco, não construir contexto com defaults permissivos.
    // Isso força requireAuth a rejeitar usuários não vinculados.
    if (!profile) {
        return null;
    }

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
}

/**
 * Guard obrigatório para TODAS as Server Actions que acessam dados de usuário.
 * Segue a SPEC_SECURITY_RBAC.md — lança BUSINESS errors em vez de retornar null.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<CurrentUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("BUSINESS: Sesión no válida. Inicia sesión nuevamente.");
    }

    if (!user.isActive) {
        throw new Error("BUSINESS: Tu cuenta no está activa. Contacta a tu consultora.");
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        throw new Error("BUSINESS: No tienes permiso para realizar esta acción.");
    }

    return user;
}
