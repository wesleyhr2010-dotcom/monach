import { prisma } from "@/lib/prisma";

/**
 * Verifica se uma revendedora pertence ao grupo (equipe) de uma colaboradora.
 * Lança BUSINESS error caso não pertença.
 *
 * Ref: docs/sistema/SPEC_SECURITY_RBAC.md §5
 */
export async function assertIsInGroup(resellerId: string, colaboradoraId: string): Promise<void> {
    const reseller = await prisma.reseller.findFirst({
        where: {
            id: resellerId,
            colaboradora_id: colaboradoraId,
        },
    });

    if (!reseller) {
        throw new Error("BUSINESS: Esta revendedora no pertenece a tu equipo.");
    }
}
