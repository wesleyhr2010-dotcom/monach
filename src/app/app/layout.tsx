import AppShell from "@/components/app/AppShell";
import AppThemeProvider from "@/components/theme/AppThemeProvider";
import { logoutApp } from "@/lib/actions/auth";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SonnerThemer } from "@/components/theme/SonnerThemer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppThemeProvider>
            <ThemeScript surface="app" />
            <AppShell logoutAction={logoutApp}>{children}</AppShell>
            <SonnerThemer surface="app" />
        </AppThemeProvider>
    );
}
