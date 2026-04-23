"use server";

import { createSupabaseSSRClient } from "@/lib/supabase-ssr";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/generated/prisma/client";

// ─── Helper: buscar role do usuário na tabela resellers ───
// Tenta por auth_user_id primeiro; se não achar, tenta por email e vincula automaticamente
async function getUserRole(
    supabase: Awaited<ReturnType<typeof createSupabaseSSRClient>>,
    authUserId: string,
    email?: string
) {
    // 1. Tentar por auth_user_id (caminho normal)
    const { data: byId } = await supabase
        .from("resellers")
        .select("role")
        .eq("auth_user_id", authUserId)
        .single();

    if (byId?.role) return byId.role as string;

    // 2. Fallback: tentar vincular por email (primeiro login)
    if (email) {
        const { data: byEmail } = await supabase
            .from("resellers")
            .select("id, role")
            .eq("email", email)
            .is("auth_user_id", null)
            .single();

        if (byEmail) {
            // Auto-vincular auth_user_id
            await supabase
                .from("resellers")
                .update({ auth_user_id: authUserId })
                .eq("id", byEmail.id);

            return byEmail.role as string;
        }
    }

    return null;
}

// ─── Helper genérico de login com verificação de role ───
async function loginWithRoleCheck(
    formData: FormData,
    allowedRoles: string[],
    redirectTo: string,
    blockedRoleMessage: string
): Promise<{ error: string }> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email e senha são obrigatórios." };
    }

    const supabase = await createSupabaseSSRClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: "E-mail ou senha incorretos." };
    }

    const role = await getUserRole(supabase, authData.user.id, email);

    if (role && !allowedRoles.includes(role)) {
        await supabase.auth.signOut();
        return { error: blockedRoleMessage };
    }

    if (!role) {
        await supabase.auth.signOut();
        return { error: "Usuário não encontrado no sistema." };
    }

    revalidatePath("/", "layout");
    redirect(redirectTo);
}

// ============================================
// Login Admin (/admin/login)
// Só permite ADMIN e COLABORADORA
// ============================================
export async function login(formData: FormData) {
    return loginWithRoleCheck(
        formData,
        ["ADMIN", "COLABORADORA"],
        "/admin",
        "Acesso restrito. Use o app de revendedora para entrar."
    );
}

// ============================================
// Login App (/app/login)
// Só permite REVENDEDORA
// ============================================
export async function loginApp(formData: FormData) {
    return loginWithRoleCheck(
        formData,
        ["REVENDEDORA"],
        "/app",
        "Acesso restrito. Use o painel administrativo para entrar."
    );
}

// ============================================
// Logout Admin
// ============================================
export async function logout() {
    const supabase = await createSupabaseSSRClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/admin/login");
}

// ============================================
// Logout App
// ============================================
export async function logoutApp() {
    const supabase = await createSupabaseSSRClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/app/login");
}

// ============================================
// Recuperar Senha
// ============================================
export async function forgotPassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "E-mail é obrigatório." };
  }

  const supabase = await createSupabaseSSRClient();

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      "http://localhost:3000";
    url = url.includes("http") ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
    return url;
  };

  const redirectTo = `${getURL()}admin/login/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[forgotPassword] Supabase error:", error.message, "| redirectTo:", redirectTo, "| email:", email);
    return { error: `Error: ${error.message}` };
  }

  return { success: true };
}

// ============================================
// OAuth Login (Google / Apple)
// Usado apenas no /admin — redireciona no callback
// ============================================
export async function loginWithProvider(provider: "google" | "apple") {
    const supabase = await createSupabaseSSRClient();
    const getURL = () => {
        let url =
            process?.env?.NEXT_PUBLIC_SITE_URL ??
            process?.env?.NEXT_PUBLIC_VERCEL_URL ??
            "http://localhost:3000";
        url = url.includes("http") ? url : `https://${url}`;
        url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
        return url;
    };

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${getURL()}api/auth/callback`,
        },
    });

    if (data.url) {
        redirect(data.url);
    } else {
        redirect("/admin/login?error=true");
    }
}
