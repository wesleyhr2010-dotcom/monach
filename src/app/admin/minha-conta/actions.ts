"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";


function getMonthBounds(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
}

// ============================================
// Perfil + Resumo da Consultora Logada
// ============================================

export async function getMinhaConta() {
    const user = await requireAuth(["COLABORADORA"]);
    const consultoraId = user.profileId!;

    const consultora = await prisma.reseller.findUnique({
        where: { id: consultoraId },
        select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            avatar_url: true,
            taxa_comissao: true,
            is_active: true,
        },
    });

    if (!consultora) {
        throw new Error("BUSINESS: Perfil no encontrado.");
    }

    // Resumo do grupo
    const revendedoras = await prisma.reseller.findMany({
        where: { colaboradora_id: consultoraId, role: "REVENDEDORA" },
        select: { id: true, is_active: true },
    });

    const revendedoraIds = revendedoras.map((r) => r.id);
    const revendedorasAtivas = revendedoras.filter((r) => r.is_active).length;

    const { start, end } = getMonthBounds();

    // Maletas do mês corrente (concluídas ou em andamento)
    const maletasMes = await prisma.maleta.findMany({
        where: {
            reseller_id: { in: revendedoraIds },
            OR: [
                { created_at: { gte: start, lt: end } },
                { updated_at: { gte: start, lt: end } },
            ],
        },
        select: {
            status: true,
            valor_total_vendido: true,
            valor_comissao_colaboradora: true,
        },
    });

    const maletasAtivas = maletasMes.filter((m) =>
        ["ativa", "atrasada"].includes(m.status)
    ).length;

    const maletasAguardando = maletasMes.filter((m) =>
        m.status === "aguardando_revisao"
    ).length;

    const faturamentoGrupoMes = maletasMes.reduce(
        (sum, m) => sum + Number(m.valor_total_vendido || 0),
        0
    );

    const comissaoMes = maletasMes.reduce(
        (sum, m) => sum + Number(m.valor_comissao_colaboradora || 0),
        0
    );

    // Totais históricos
    const totais = await prisma.maleta.aggregate({
        where: {
            reseller_id: { in: revendedoraIds },
            status: "concluida",
        },
        _sum: {
            valor_total_vendido: true,
            valor_comissao_colaboradora: true,
        },
        _count: { id: true },
    });

    return {
        perfil: {
            id: consultora.id,
            name: consultora.name,
            email: consultora.email,
            whatsapp: consultora.whatsapp,
            avatar_url: consultora.avatar_url,
            taxa_comissao: Number(consultora.taxa_comissao),
            is_active: consultora.is_active,
        },
        resumo: {
            revendedorasTotal: revendedoras.length,
            revendedorasAtivas,
            maletasAtivas,
            maletasAguardando,
            faturamentoGrupoMes,
            comissaoMes,
            faturamentoGrupoTotal: Number(totais._sum.valor_total_vendido || 0),
            comissaoTotal: Number(totais._sum.valor_comissao_colaboradora || 0),
            maletasFechadasTotal: totais._count.id,
        },
    };
}

// ============================================
// Extrato de Comissões (mês a mês)
// ============================================

export async function getExtratoComissoes(ano?: number) {
    const user = await requireAuth(["COLABORADORA"]);
    const consultoraId = user.profileId!;

    const targetYear = ano || new Date().getFullYear();
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);

    const revendedoras = await prisma.reseller.findMany({
        where: { colaboradora_id: consultoraId, role: "REVENDEDORA" },
        select: { id: true },
    });

    const revendedoraIds = revendedoras.map((r) => r.id);

    const maletas = await prisma.maleta.findMany({
        where: {
            reseller_id: { in: revendedoraIds },
            status: "concluida",
            updated_at: { gte: start, lt: end },
        },
        select: {
            numero: true,
            updated_at: true,
            valor_total_vendido: true,
            valor_comissao_colaboradora: true,
            pct_comissao_aplicado: true,
            reseller: { select: { name: true } },
        },
        orderBy: { updated_at: "desc" },
    });

    // Agrupar por mês
    const mesesMap = new Map<
        string,
        {
            mes: string;
            faturamento: number;
            comissao: number;
            maletas: number;
            detalhes: {
                numero: number;
                revendedora: string;
                vendas: number;
                comissao: number;
                pct: number;
            }[];
        }
    >();

    for (const m of maletas) {
        const key = `${m.updated_at.getFullYear()}-${String(m.updated_at.getMonth() + 1).padStart(2, "0")}`;
        const label = m.updated_at.toLocaleDateString("es-PY", {
            month: "short",
            year: "numeric",
        });

        if (!mesesMap.has(key)) {
            mesesMap.set(key, {
                mes: label,
                faturamento: 0,
                comissao: 0,
                maletas: 0,
                detalhes: [],
            });
        }

        const grupo = mesesMap.get(key)!;
        const vendas = Number(m.valor_total_vendido || 0);
        const comissao = Number(m.valor_comissao_colaboradora || 0);
        const pct = Number(m.pct_comissao_aplicado || 0);

        grupo.faturamento += vendas;
        grupo.comissao += comissao;
        grupo.maletas += 1;
        grupo.detalhes.push({
            numero: m.numero,
            revendedora: m.reseller.name,
            vendas,
            comissao,
            pct,
        });
    }

    const extrato = Array.from(mesesMap.values()).sort((a, b) => {
        // Ordenar por mês decrescente
        const [ma, ya] = a.mes.split(" ");
        const [mb, yb] = b.mes.split(" ");
        const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
        const ia = monthNames.indexOf(ma.toLowerCase());
        const ib = monthNames.indexOf(mb.toLowerCase());
        const yaNum = parseInt(ya);
        const ybNum = parseInt(yb);
        if (yaNum !== ybNum) return ybNum - yaNum;
        return ib - ia;
    });

    const totalAno = extrato.reduce((s, m) => s + m.comissao, 0);

    return { ano: targetYear, totalAno, extrato };
}
