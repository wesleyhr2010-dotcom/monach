import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/user";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Evitar loop de redirect na página de login
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || headersList.get("x-pathname") || "";
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

    return <AdminLayoutClient userRole={user.role}>{children}</AdminLayoutClient>;
}
