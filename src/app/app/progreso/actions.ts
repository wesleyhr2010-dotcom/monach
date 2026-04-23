"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

export type RegraProgresso = {
    id: string;
    nome: string;
    descricao: string;
    acao: string;
    pontos: number;
    icone: string;
    tipo: string;
    limite_diario: number | null;
    progreso_hoy: number;
    progreso_total: number;
    estado: "disponible" | "en_progreso" | "completado_hoy" | "completado_siempre";
};

export async function getRegrasProgresso(): Promise<{
    regras: RegraProgresso[];
    totalPuntos: number;
}> {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const regras = await prisma.gamificacaoRegra.findMany({
        where: { ativo: true },
        orderBy: { ordem: "asc" },
    });

    const regrasConProgresso = await Promise.all(
        regras.map(async (regra) => {
            // Conteo del día para reglas diarias
            const progreso_hoy = await prisma.pontosExtrato.count({
                where: {
                    reseller_id: resellerId,
                    regra_id: regra.id,
                    created_at: { gte: startOfDay },
                },
            });

            // Conteo total para reglas únicas
            const progreso_total = await prisma.pontosExtrato.count({
                where: { reseller_id: resellerId, regra_id: regra.id },
            });

            let estado: RegraProgresso["estado"] = "disponible";

            if (regra.tipo === "unico") {
                estado = progreso_total >= 1 ? "completado_siempre" : "disponible";
            } else if (regra.tipo === "diario" && regra.limite_diario != null) {
                if (progreso_hoy >= regra.limite_diario) {
                    estado = "completado_hoy";
                } else if (progreso_hoy > 0) {
                    estado = "en_progreso";
                }
            } else if (regra.tipo === "mensal") {
                const countMonth = await prisma.pontosExtrato.count({
                    where: {
                        reseller_id: resellerId,
                        regra_id: regra.id,
                        created_at: { gte: startOfMonth },
                    },
                });
                estado = countMonth >= 1 ? "completado_hoy" : "disponible";
            }

            return {
                id: regra.id,
                nome: regra.nome,
                descricao: regra.descricao,
                acao: regra.acao,
                pontos: regra.pontos,
                icone: regra.icone,
                tipo: regra.tipo,
                limite_diario: regra.limite_diario,
                progreso_hoy,
                progreso_total,
                estado,
            };
        })
    );

    const totalAggr = await prisma.pontosExtrato.aggregate({
        where: { reseller_id: resellerId },
        _sum: { pontos: true },
    });

    return {
        regras: regrasConProgresso,
        totalPuntos: totalAggr._sum.pontos ?? 0,
    };
}

// ============================================
// Brindes — Revendedora
// ============================================

export async function getBrindesAtivos() {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const [brindes, saldoAggr] = await Promise.all([
        prisma.brinde.findMany({
            where: { ativo: true },
            orderBy: { custo_pontos: "asc" },
        }),
        prisma.pontosExtrato.aggregate({
            where: { reseller_id: resellerId },
            _sum: { pontos: true },
        }),
    ]);

    const saldo = saldoAggr._sum.pontos ?? 0;

    return {
        brindes: brindes.map((b) => ({
            ...b,
            disponivel: saldo >= b.custo_pontos && (b.estoque > 0 || b.estoque < 0),
        })),
        saldo,
    };
}

export async function canjearRegalo(brindeId: string) {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    await prisma.$transaction(async (tx) => {
        const saldoAggr = await tx.pontosExtrato.aggregate({
            where: { reseller_id: resellerId },
            _sum: { pontos: true },
        });
        const saldo = saldoAggr._sum.pontos ?? 0;

        const brinde = await tx.brinde.findUniqueOrThrow({
            where: { id: brindeId },
        });

        if (!brinde.ativo) {
            throw new Error("BUSINESS: Este regalo no está disponible.");
        }
        if (saldo < brinde.custo_pontos) {
            throw new Error("BUSINESS: Puntos insuficientes.");
        }
        if (brinde.estoque === 0) {
            throw new Error("BUSINESS: Regalo sin stock disponible.");
        }

        // Debitar pontos
        await tx.pontosExtrato.create({
            data: {
                reseller_id: resellerId,
                pontos: -brinde.custo_pontos,
                descricao: `Canje: ${brinde.nome}`,
            },
        });

        // Decrementar stock (se não for ilimitado)
        if (brinde.estoque > 0) {
            await tx.brinde.update({
                where: { id: brindeId },
                data: { estoque: { decrement: 1 } },
            });
        }

        // Criar solicitud
        await tx.solicitacaoBrinde.create({
            data: {
                reseller_id: resellerId,
                brinde_id: brindeId,
                pontos_debitados: brinde.custo_pontos,
            },
        });
    });

    return { success: true };
}

export async function getExtratoPontos(page = 0) {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const [extrato, saldoAggr, totalCount] = await Promise.all([
        prisma.pontosExtrato.findMany({
            where: { reseller_id: resellerId },
            orderBy: { created_at: "desc" },
            take: 20,
            skip: page * 20,
        }),
        prisma.pontosExtrato.aggregate({
            where: { reseller_id: resellerId },
            _sum: { pontos: true },
        }),
        prisma.pontosExtrato.count({
            where: { reseller_id: resellerId },
        }),
    ]);

    return {
        extrato,
        saldo: saldoAggr._sum.pontos ?? 0,
        totalCount,
        hasMore: (page + 1) * 20 < totalCount,
    };
}
