import { createSupabaseSSRClient } from "@/lib/supabase-ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const supabase = await createSupabaseSSRClient();
        const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

        // Redirecionar pela role do usuário
        if (sessionData?.user?.id) {
            const { data: profile } = await supabase
                .from("resellers")
                .select("role")
                .eq("auth_user_id", sessionData.user.id)
                .single();

            if (profile?.role === "REVENDEDORA") {
                return NextResponse.redirect(new URL("/app", request.url));
            }
        }
    }

    // Default: admin (ADMIN/COLABORADORA ou fallback)
    return NextResponse.redirect(new URL("/admin", request.url));
}
