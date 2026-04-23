import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
