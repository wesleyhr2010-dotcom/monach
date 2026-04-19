"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

export async function getPerfilRevendedora() {
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    if (!user || !user.profileId) {
        throw new Error("Não autorizado");
    }

    const resellerId = user.profileId;

    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: {
            name: true,
            email: true,
            whatsapp: true,
            taxa_comissao: true,
            created_at: true,
        },
    });

    if (!reseller) {
        throw new Error("Perfil não encontrado");
    }

    // Count maletas
    const totalMaletas = await prisma.maleta.count({
        where: { reseller_id: resellerId },
    });

    // Count sales and pieces
    const vendas = await prisma.vendaMaleta.findMany({
        where: {
            maleta_item: {
                maleta: { reseller_id: resellerId },
            },
        },
        select: { quantidade: true },
    });

    const totalVendas = vendas.length;
    const totalPecas = vendas.reduce((sum, v) => sum + v.quantidade, 0);

    // XP total
    const pontosResult = await prisma.pontosExtrato.aggregate({
        where: { reseller_id: resellerId },
        _sum: { pontos: true },
    });

    return {
        name: reseller.name,
        email: reseller.email,
        whatsapp: reseller.whatsapp,
        comissaoPct: Number(reseller.taxa_comissao),
        createdAt: reseller.created_at.toISOString(),
        nivel: "Iniciante",
        xpTotal: pontosResult._sum.pontos || 0,
        totalMaletas,
        totalVendas,
        totalPecas,
    };
}
