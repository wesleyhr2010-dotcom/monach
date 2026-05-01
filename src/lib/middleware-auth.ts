import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware de autenticação.
 *
 * REGRA DE PERFORMANCE: o middleware NÃO faz query ao banco de dados.
 * Ele apenas:
 *   1. Refresca o token JWT do Supabase (obrigatório para SSR)
 *   2. Redireciona auth callbacks (recovery links)
 *   3. Redireciona usuários não-autenticados para login
 *
 * Verificação de role e is_active é feita nos layouts e server actions
 * via getCurrentUser() (cached com React.cache por request).
 */
export async function updateSession(request: NextRequest) {
    // Injeta o pathname atual como header para que layouts server-side possam lê-lo
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-current-path", request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request: { headers: requestHeaders },
    })

    // Create a supabase client to use the cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const url = request.nextUrl.clone()

    // ============================================
    // Supabase auth callback fallback
    // Quando o template/redirect URL do Supabase não está configurado,
    // o link de recuperação chega como https://dominio/?code=...
    // ou https://dominio/?token_hash=...&type=recovery.
    // Redireciona para o route handler que consegue setar cookies.
    // ============================================
    if (
        url.pathname === "/" &&
        (url.searchParams.has("code") || url.searchParams.has("token_hash"))
    ) {
        const callbackUrl = url.clone()
        callbackUrl.pathname = "/auth/callback"
        return NextResponse.redirect(callbackUrl)
    }

    // Refresh do token JWT — obrigatório para manter a sessão válida no SSR
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAdminRoute = url.pathname.startsWith("/admin")
    const isAdminLoginPage =
        url.pathname === "/admin/login" ||
        url.pathname.startsWith("/admin/login/")
    const isAppRoute = url.pathname.startsWith("/app")
    const isAppLoginPage = url.pathname.startsWith("/app/login")
    const isAppResetPage = url.pathname.startsWith("/app/nueva-contrasena")

    // ============================================
    // Redirect não-autenticados para login
    // (Role check é feito no layout via getCurrentUser cached)
    // ============================================
    if (isAdminRoute && !user && !isAdminLoginPage) {
        url.pathname = "/admin/login"
        return NextResponse.redirect(url)
    }

    if (isAppRoute && !user && !isAppLoginPage && !isAppResetPage) {
        url.pathname = "/app/login"
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

