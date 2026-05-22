import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/user";
import { getMaletaScope } from "@/lib/auth/get-reseller-scope";
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import AdminThemeProvider from "@/components/theme/AdminThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SonnerThemer } from "@/components/theme/SonnerThemer";

/**
 * Layout do shell administrativo.
 * Usa o header x-current-path (injetado pelo middleware) para detectar a rota
 * de login e evitar o loop de redirecionamento sem exigir autenticação nela.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get("x-current-path") ?? "";

    // A página de login não deve passar pelo guard de autenticação
    if (pathname.startsWith("/admin/login")) {
        return <>{children}</>;
    }

    const user = await getCurrentUser();

    if (!user) {
        redirect("/admin/login");
    }

    if (!user.isActive) {
        redirect("/admin/login?error=inactive");
    }

    // Se for revendedora, não pode acessar /admin
    if (user.role === "REVENDEDORA") {
        redirect("/app");
    }

    // COLABORADORA não acessa rotas exclusivas de ADMIN
    if (user.role === "COLABORADORA") {
        const restrictedPaths = [
            "/admin/equipe",
            "/admin/consultoras",
            "/admin/leads",
            "/admin/produtos",
            "/admin/categorias",
            "/admin/estoque",
            "/admin/gamificacao",
            "/admin/brindes",
            "/admin/config",
            "/admin/relatorios",
        ];
        const isRestricted = restrictedPaths.some((path) =>
            pathname === path || pathname.startsWith(path + "/")
        );
        if (isRestricted) {
            redirect("/admin");
        }
    }

    // Contagem inicial de devoluções pendentes + leads (SSR, sem waterfall)
    const scope = getMaletaScope(user);
    const [maletaCount, leadsCount] = await Promise.all([
        prisma.maleta.count({
            where: { ...scope, status: "aguardando_revisao" },
        }),
        user.role === "ADMIN"
            ? prisma.revendedoraLead.count({ where: { status: "pendente" } })
            : Promise.resolve(0),
    ]);
    const alertCount = maletaCount + leadsCount;

    return (
        <AdminThemeProvider>
            <ThemeScript surface="admin" />
            <AdminLayoutClient userRole={user.role} alertCount={alertCount} leadsCount={leadsCount}>
                {children}
            </AdminLayoutClient>
            <SonnerThemer surface="admin" />
        </AdminThemeProvider>
    );
}
