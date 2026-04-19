import { createSupabaseSSRClient } from "./supabase-ssr";
import { prisma } from "./prisma";

export type Role = "ADMIN" | "COLABORADORA" | "REVENDEDORA";

export async function getCurrentUser() {
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
            is_active: true
        }
    });

    // 2. Fallback: buscar por email e auto-vincular auth_user_id
    if (!profile && user.email) {
        profile = await prisma.reseller.findFirst({
            where: { email: user.email, auth_user_id: null },
            select: {
                id: true,
                name: true,
                role: true,
                taxa_comissao: true,
                is_active: true
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

    return {
        id: user.id,
        email: user.email,
        profileId: profile?.id || null,
        name: profile?.name || user.email?.split('@')[0] || "Utilizador",
        role: (profile?.role as Role) || "REVENDEDORA",
        isActive: profile !== null ? profile.is_active : true,
        rawUser: user
    };
}

export async function requireAuth(allowedRoles?: Role[]) {
    const user = await getCurrentUser();

    if (!user || !user.isActive) {
        return null;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return null; // Acesso negado
    }

    return user;
}
