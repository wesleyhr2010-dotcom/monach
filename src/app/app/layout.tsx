import AppShell from "@/components/app/AppShell";
import { logoutApp } from "@/lib/actions/auth";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ThemeScript surface="app" />
            <AppShell logoutAction={logoutApp}>{children}</AppShell>
            <Toaster position="top-center" richColors />
        </>
    );
}
