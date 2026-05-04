import AppShell from "@/components/app/AppShell";
import { Toaster } from "sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppShell>{children}</AppShell>
            <Toaster position="top-center" richColors />
        </>
    );
}
