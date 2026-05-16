import AppShell from "@/components/app/AppShell";
import { logoutApp } from "@/lib/actions/auth";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SonnerThemer } from "@/components/theme/SonnerThemer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ThemeScript surface="app" />
            <AppShell logoutAction={logoutApp}>{children}</AppShell>
            <SonnerThemer surface="app" />
        </>
    );
}
