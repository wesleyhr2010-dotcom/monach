import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import AppDashboardClient from "./AppDashboardClient";

export default async function AppDashboardPage() {
    const user = await getCurrentUser();

    if (user?.profileId) {
        const reseller = await prisma.reseller.findUnique({
            where: { id: user.profileId },
            select: {
                onboarding_completo: true,
                _count: { select: { maletas: true } },
            },
        });

        const isPrimeiroAcesso =
            reseller &&
            !reseller.onboarding_completo &&
            reseller._count.maletas === 0;

        if (isPrimeiroAcesso) {
            redirect("/app/bienvenida");
        }
    }

    return <AppDashboardClient />;
}
