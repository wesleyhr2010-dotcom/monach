// ============================================
// Supabase SSR Client (cookie-based auth)
// Para uso em Server Components / Server Actions / Middleware
// ============================================

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseSSRClient() {
    const cookieStore = await cookies();

    return createSupabaseServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Component — cookies são read-only
                    }
                },
            },
        }
    );
}

// Client para browser (mantém cookies de auth sincronizados)
export function createSupabaseBrowserClient() {
    const { createBrowserClient } = require("@supabase/ssr");
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
