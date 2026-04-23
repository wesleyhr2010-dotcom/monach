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
