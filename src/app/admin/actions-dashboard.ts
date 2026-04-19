"use server";

import { prisma } from "@/lib/prisma";

function getMesAtual() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function formatMaletaNumero(id: string): string {
    const hex = id.replace(/-/g, "").slice(-4).toUpperCase();
    return `#${parseInt(hex, 16) % 1000}`.padStart(4, "0");
}

// ============================================
// Métricas KPI
// ============================================

export interface DashboardMetricas {
    faturamento: number;
    faturamentoVariacao: number;
    maletasAtivas: number;
    maletasAtrasadas: number;
    revendedorasAtivas: number;
    revendedorasNovas: number;
    totalAlertas: number;
}

export async function getDashboardMetricas(colaboradoraId?: string): Promise<DashboardMetricas> {
    const { start, end } = getMesAtual();
    const mesAnteriorStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const mesAnteriorEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);

    const resellerScope = colaboradoraId
        ? { reseller: { colaboradora_id: colaboradoraId } }
        : {};

    const [
        maletasAtivas,
        maletasAtrasadas,
        maletasAguardando,
        revendedorasAtivas,
        revendedorasNovas,
        fatMes,
        fatMesAnterior,
    ] = await Promise.all([
        prisma.maleta.count({ where: { status: "ativa", ...resellerScope } }),
        prisma.maleta.count({ where: { status: "atrasada", ...resellerScope } }),
        prisma.maleta.count({ where: { status: "aguardando_revisao", ...resellerScope } }),
        prisma.reseller.count({
            where: {
                role: "REVENDEDORA",
                is_active: true,
                ...(colaboradoraId ? { colaboradora_id: colaboradoraId } : {}),
            },
        }),
        prisma.reseller.count({
            where: {
                role: "REVENDEDORA",
                is_active: true,
                created_at: { gte: start, lte: end },
                ...(colaboradoraId ? { colaboradora_id: colaboradoraId } : {}),
            },
        }),
        prisma.maleta.aggregate({
            _sum: { valor_total_vendido: true },
            where: {
                status: "concluida",
                updated_at: { gte: start, lte: end },
                ...resellerScope,
            },
        }),
        prisma.maleta.aggregate({
            _sum: { valor_total_vendido: true },
            where: {
                status: "concluida",
                updated_at: { gte: mesAnteriorStart, lte: mesAnteriorEnd },
                ...resellerScope,
            },
        }),
    ]);

    const faturamento = Number(fatMes._sum.valor_total_vendido ?? 0);
    const fatAnterior = Number(fatMesAnterior._sum.valor_total_vendido ?? 0);
    const variacao = fatAnterior > 0 ? Math.round(((faturamento - fatAnterior) / fatAnterior) * 100) : 0;

    return {
        faturamento,
        faturamentoVariacao: variacao,
        maletasAtivas,
        maletasAtrasadas,
        revendedorasAtivas,
        revendedorasNovas,
        totalAlertas: maletasAtrasadas + maletasAguardando,
    };
}

// ============================================
// Alertas: Maletas com atenção
// ============================================

export interface AlertaMaleta {
    id: string;
    numero: string;
    nomeReseller: string;
    tipo: "atrasada" | "acerto_pendente" | "vence_amanha";
    diasAtraso?: number;
}

export async function getAlertasMaletas(colaboradoraId?: string): Promise<AlertaMaleta[]> {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(23, 59, 59, 999);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const resellerScope = colaboradoraId
        ? { reseller: { colaboradora_id: colaboradoraId } }
        : {};

    const [atrasadas, aguardando, vencemAmanha] = await Promise.all([
        prisma.maleta.findMany({
            where: { status: "atrasada", ...resellerScope },
            include: { reseller: { select: { name: true } } },
            orderBy: { data_limite: "asc" },
            take: 3,
        }),
        prisma.maleta.findMany({
            where: { status: "aguardando_revisao", ...resellerScope },
            include: { reseller: { select: { name: true } } },
            orderBy: { updated_at: "desc" },
            take: 2,
        }),
        prisma.maleta.findMany({
            where: {
                status: "ativa",
                data_limite: { gte: hoje, lte: amanha },
                ...resellerScope,
            },
            include: { reseller: { select: { name: true } } },
            orderBy: { data_limite: "asc" },
            take: 2,
        }),
    ]);

    const now = Date.now();

    const resultado: AlertaMaleta[] = [
        ...atrasadas.map((m) => ({
            id: m.id,
            numero: formatMaletaNumero(m.id),
            nomeReseller: m.reseller.name,
            tipo: "atrasada" as const,
            diasAtraso: Math.ceil((now - m.data_limite.getTime()) / 86400000),
        })),
        ...aguardando.map((m) => ({
            id: m.id,
            numero: formatMaletaNumero(m.id),
            nomeReseller: m.reseller.name,
            tipo: "acerto_pendente" as const,
        })),
        ...vencemAmanha.map((m) => ({
            id: m.id,
            numero: formatMaletaNumero(m.id),
            nomeReseller: m.reseller.name,
            tipo: "vence_amanha" as const,
        })),
    ];

    return resultado.slice(0, 5);
}

// ============================================
// Ranking: Desempenho por Consultora (ADMIN)
// ============================================

export interface RankingColaboradora {
    id: string;
    nome: string;
    initials: string;
    faturamento: number;
    totalRevendedoras: number;
    percentMeta: number;
}

export async function getRankingColaboradoras(): Promise<RankingColaboradora[]> {
    const { start, end } = getMesAtual();

    const colaboradoras = await prisma.reseller.findMany({
        where: { role: "COLABORADORA", is_active: true },
        select: {
            id: true,
            name: true,
            revendedoras_sob_mim: {
                select: {
                    id: true,
                    maletas: {
                        where: {
                            status: "concluida",
                            updated_at: { gte: start, lte: end },
                        },
                        select: { valor_total_vendido: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
        take: 5,
    });

    const ranking = colaboradoras.map((c) => {
        const faturamento = c.revendedoras_sob_mim
            .flatMap((r) => r.maletas)
            .reduce((sum, m) => sum + Number(m.valor_total_vendido ?? 0), 0);

        const words = c.name.trim().split(" ");
        const initials = (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();

        return {
            id: c.id,
            nome: c.name,
            initials,
            faturamento,
            totalRevendedoras: c.revendedoras_sob_mim.length,
            percentMeta: 0,
        };
    });

    const maxFat = Math.max(...ranking.map((r) => r.faturamento), 1);
    return ranking
        .map((r) => ({ ...r, percentMeta: Math.round((r.faturamento / maxFat) * 100) }))
        .sort((a, b) => b.faturamento - a.faturamento);
}

// ============================================
// Ranking: Desempenho por Revendedora (COLABORADORA)
// ============================================

export interface RankingRevendedora {
    id: string;
    nome: string;
    initials: string;
    faturamento: number;
    percentMeta: number;
}

export async function getRankingRevendedoras(colaboradoraId: string): Promise<RankingRevendedora[]> {
    const { start, end } = getMesAtual();

    const revendedoras = await prisma.reseller.findMany({
        where: { colaboradora_id: colaboradoraId, role: "REVENDEDORA", is_active: true },
        select: {
            id: true,
            name: true,
            maletas: {
                where: {
                    status: "concluida",
                    updated_at: { gte: start, lte: end },
                },
                select: { valor_total_vendido: true },
            },
        },
        orderBy: { name: "asc" },
        take: 5,
    });

    const ranking = revendedoras.map((r) => {
        const faturamento = r.maletas.reduce((sum, m) => sum + Number(m.valor_total_vendido ?? 0), 0);
        const words = r.name.trim().split(" ");
        const initials = (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
        return { id: r.id, nome: r.name, initials, faturamento, percentMeta: 0 };
    });

    const maxFat = Math.max(...ranking.map((r) => r.faturamento), 1);
    return ranking
        .map((r) => ({ ...r, percentMeta: Math.round((r.faturamento / maxFat) * 100) }))
        .sort((a, b) => b.faturamento - a.faturamento);
}

// ============================================
// Comissão própria (COLABORADORA)
// ============================================

export async function getMinhaComissao(resellerId: string): Promise<number> {
    const { start, end } = getMesAtual();
    const result = await prisma.maleta.aggregate({
        _sum: { valor_comissao_colaboradora: true },
        where: {
            status: "concluida",
            updated_at: { gte: start, lte: end },
            reseller: { colaboradora_id: resellerId },
        },
    });
    return Number(result._sum.valor_comissao_colaboradora ?? 0);
}
