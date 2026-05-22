import AdminThemeProvider from "@/components/theme/AdminThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";

/**
 * Layout dedicado para /admin/login.
 * Aplica o tema admin (dark/light) sem o shell com sidebar.
 */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminThemeProvider>
            <ThemeScript surface="admin" />
            {children}
        </AdminThemeProvider>
    );
}
