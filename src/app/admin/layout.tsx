import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/user";
import { getResellerScope } from "@/lib/auth/get-reseller-scope";
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

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

    // Contagem inicial de devoluções pendentes (SSR, sem waterfall)
    const scope = getResellerScope(user);
    const alertCount = await prisma.maleta.count({
        where: {
            ...scope,
            status: "aguardando_revisao",
        },
    });

    return (
        <AdminLayoutClient userRole={user.role} alertCount={alertCount}>
            {children}
        </AdminLayoutClient>
    );
}
