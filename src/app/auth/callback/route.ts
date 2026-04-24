import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSSRClient } from "@/lib/supabase-ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const VALID_OTP_TYPES: EmailOtpType[] = [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
    return !!value && (VALID_OTP_TYPES as string[]).includes(value);
}

export async function GET(request: NextRequest) {
    const origin = request.nextUrl.origin;
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const rawType = searchParams.get("type");
    const nextParam = searchParams.get("next");

    const errorRedirect = `${origin}/app/login/recuperar-contrasena?error=expired`;

    const supabase = await createSupabaseSSRClient();
    let userId: string | null = null;

    // Preferir o fluxo OTP (token_hash + verifyOtp) — não depende do code_verifier
    // armazenado no navegador, então funciona mesmo se o usuário abrir o email
    // em outro dispositivo/navegador/aba anônima.
    if (tokenHash && isEmailOtpType(rawType)) {
        const { data, error } = await supabase.auth.verifyOtp({
            type: rawType,
            token_hash: tokenHash,
        });

        if (error || !data.session) {
            console.error("[auth/callback] verifyOtp failed:", error?.message);
            return NextResponse.redirect(errorRedirect);
        }

        userId = data.session.user.id;
    } else if (code) {
        // Fluxo PKCE — requer que o cookie/storage do code_verifier exista no
        // mesmo navegador que iniciou o reset. Se falhar, quase sempre é porque
        // o usuário trocou de dispositivo/navegador.
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
            console.error("[auth/callback] exchangeCodeForSession failed:", error?.message);
            return NextResponse.redirect(errorRedirect);
        }

        userId = data.session.user.id;
    } else {
        return NextResponse.redirect(`${origin}/app/login`);
    }

    if (nextParam && nextParam.startsWith("/")) {
        return NextResponse.redirect(`${origin}${nextParam}`);
    }

    const { data: profile } = await supabase
        .from("resellers")
        .select("role")
        .eq("auth_user_id", userId)
        .single();

    if (profile?.role === "ADMIN" || profile?.role === "COLABORADORA") {
        return NextResponse.redirect(`${origin}/admin/login/reset-password`);
    }

    return NextResponse.redirect(`${origin}/app/nueva-contrasena`);
}
