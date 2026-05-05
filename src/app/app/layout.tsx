import AppShell from "@/components/app/AppShell";
import { logoutApp } from "@/lib/actions/auth";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppShell logoutAction={logoutApp}>{children}</AppShell>
            <Toaster position="top-center" richColors />
        </>
    );
}
