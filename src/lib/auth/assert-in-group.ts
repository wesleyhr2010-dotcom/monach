import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-utils";

/**
 * Verifica se uma revendedora pertence ao grupo (equipe) de uma colaboradora.
 * Retorna ActionResult em vez de lançar error.
 *
 * Ref: docs/sistema/SPEC_SECURITY_RBAC.md §5
 */
export async function assertIsInGroup(resellerId: string, colaboradoraId: string): Promise<ActionResult<void>> {
    const reseller = await prisma.reseller.findFirst({
        where: {
            id: resellerId,
            colaboradora_id: colaboradoraId,
        },
    });

    if (!reseller) {
        return { success: false, error: "Esta revendedora no pertenece a tu equipo." };
    }

    return { success: true, data: undefined };
}
