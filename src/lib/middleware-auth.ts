import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
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

    // Request the user session from Supabase
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const isAdminRoute = url.pathname.startsWith("/admin")
    const isAdminLoginPage = url.pathname === "/admin/login" || url.pathname.startsWith("/admin/login/")
    const isAppRoute = url.pathname.startsWith("/app")
    const isAppLoginPage = url.pathname.startsWith("/app/login")
    const isAppResetPage = url.pathname.startsWith("/app/nueva-contrasena")

    let userRole = null;
    let isActive = true;

    if (user) {
        // Busca a role e status na tabela unificada 'resellers'
        const { data: profile } = await supabase
            .from('resellers')
            .select('role, is_active')
            .eq('auth_user_id', user.id)
            .single()

        if (profile) {
            userRole = profile.role;
            isActive = profile.is_active;
        }
    }

    // ============================================
    // Logic for /admin routes (ADMIN or COLABORADORA)
    // ============================================
    if (isAdminRoute) {
        if (!user && !isAdminLoginPage) {
            url.pathname = "/admin/login"
            return NextResponse.redirect(url)
        }

        if (user) {
            // Usuário inativo não acessa nada
            if (!isActive) {
                url.pathname = "/app/login"
                return NextResponse.redirect(url)
            }

            // FAIL-CLOSED: só permite /admin se role for ADMIN ou COLABORADORA explicitamente.
            // Qualquer outro caso (REVENDEDORA, role null, erro de query) é redirecionado.
            if (userRole !== 'ADMIN' && userRole !== 'COLABORADORA') {
                url.pathname = "/app"
                return NextResponse.redirect(url)
            }

            // Se for Admin/Colaboradora tentando acessar o Login, mande pro painel
            if (isAdminLoginPage) {
                url.pathname = "/admin"
                return NextResponse.redirect(url)
            }

            // COLABORADORA não acessa rotas exclusivas de ADMIN
            if (userRole === 'COLABORADORA') {
                const restrictedPaths = [
                    "/admin/productos",
                    "/admin/gamificacion",
                    "/admin/brindes",
                    "/admin/commission-tiers",
                    "/admin/contratos",
                    "/admin/equipo/consultoras",
                ];
                const isRestricted = restrictedPaths.some((path) =>
                    url.pathname === path || url.pathname.startsWith(path + "/")
                );
                if (isRestricted) {
                    url.pathname = "/admin"
                    return NextResponse.redirect(url)
                }
            }
        }
    }

    // ============================================
    // Logic for /app routes (REVENDEDORA)
    // ============================================
    if (isAppRoute) {
        if (!user && !isAppLoginPage && !isAppResetPage) {
            url.pathname = "/app/login"
            return NextResponse.redirect(url)
        }

        if (user) {
            // Usuário inativo não acessa nada
            if (!isActive) {
                url.pathname = "/app/login"
                return NextResponse.redirect(url)
            }

            // Se for Admin/Colaboradora tentando acessar /app, expulse para o /admin
            if (userRole === 'ADMIN' || userRole === 'COLABORADORA') {
                url.pathname = "/admin"
                return NextResponse.redirect(url)
            }

            // Se for Revendedora tentando acessar o Login, mande pro painel
            if (isAppLoginPage && userRole === 'REVENDEDORA') {
                url.pathname = "/app"
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}

