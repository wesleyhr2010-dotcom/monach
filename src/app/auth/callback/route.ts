import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSSRClient } from "@/lib/supabase-ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const origin = request.nextUrl.origin;
    const code = request.nextUrl.searchParams.get("code");
    const nextParam = request.nextUrl.searchParams.get("next");

    if (!code) {
        return NextResponse.redirect(`${origin}/app/login`);
    }

    const supabase = await createSupabaseSSRClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error("[auth/callback] exchangeCodeForSession failed:", error?.message);
        return NextResponse.redirect(
            `${origin}/app/login/recuperar-contrasena?error=expired`
        );
    }

    if (nextParam && nextParam.startsWith("/")) {
        return NextResponse.redirect(`${origin}${nextParam}`);
    }

    const { data: profile } = await supabase
        .from("resellers")
        .select("role")
        .eq("auth_user_id", data.session.user.id)
        .single();

    if (profile?.role === "ADMIN" || profile?.role === "COLABORADORA") {
        return NextResponse.redirect(`${origin}/admin/login/reset-password`);
    }

    return NextResponse.redirect(`${origin}/app/nueva-contrasena`);
}
