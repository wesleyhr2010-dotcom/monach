import { prisma } from "@/lib/prisma";

/**
 * Tipo do cliente Prisma estendido (com middleware de criptografia).
 * Usado em transações para compatibilidade com o client estendido.
 */
type ExtendedPrismaClient = typeof prisma;

export type RankInfo = {
  nome: string;
  cor: string;
  pontosMinimos: number;
};

/**
 * Calcula o rank atual da revendedora baseado nos pontos históricos.
 * Rank nunca é resetado — sempre acumulativo.
 */
export async function getRankAtual(resellerId: string): Promise<RankInfo> {
  const totalPontos = await prisma.pontosExtrato.aggregate({
    where: { reseller_id: resellerId },
    _sum: { pontos: true },
  });

  const pontos = totalPontos._sum.pontos ?? 0;

  const niveis = await prisma.nivelRegra.findMany({
    where: { ativo: true },
    orderBy: { pontos_minimos: "desc" },
  });

  const nivel =
    niveis.find((n) => pontos >= n.pontos_minimos) ?? niveis[niveis.length - 1];

  return {
    nome: nivel?.nome ?? "Bronce",
    cor: nivel?.cor ?? "#CD7F32",
    pontosMinimos: nivel?.pontos_minimos ?? 0,
  };
}

export type CommissionInfo = {
  tierAtual: { pct: number; min_sales_value: number } | null;
  proximoTier: { pct: number; min_sales_value: number } | null;
  faltaParaProximo: number;
};

/**
 * Calcula o tier de comissão atual e o próximo tier baseado no faturamento do mês.
 */
export async function computeCommissionPct(
  faturamentoMes: number
): Promise<CommissionInfo> {
  const tiers = await prisma.commissionTier.findMany({
    where: { ativo: true },
    orderBy: { min_sales_value: "asc" },
  });

  if (tiers.length === 0) {
    return { tierAtual: null, proximoTier: null, faltaParaProximo: 0 };
  }

  let tierAtualIdx = -1;
  for (let i = 0; i < tiers.length; i++) {
    if (faturamentoMes >= Number(tiers[i].min_sales_value)) {
      tierAtualIdx = i;
    }
  }

  const tierAtual = tierAtualIdx >= 0 ? tiers[tierAtualIdx] : null;
  const proximoTier =
    tierAtualIdx >= 0 && tierAtualIdx < tiers.length - 1
      ? tiers[tierAtualIdx + 1]
      : null;

  const faltaParaProximo = proximoTier
    ? Math.max(0, Number(proximoTier.min_sales_value) - faturamentoMes)
    : 0;

  return {
    tierAtual: tierAtual
      ? { pct: Number(tierAtual.pct), min_sales_value: Number(tierAtual.min_sales_value) }
      : null,
    proximoTier: proximoTier
      ? { pct: Number(proximoTier.pct), min_sales_value: Number(proximoTier.min_sales_value) }
      : null,
    faltaParaProximo,
  };
}

/**
 * Concede pontos de gamificação a uma revendedora com base em uma regra configurada no banco.
 * Respeita tipo (unico, diario, mensal, por_evento), limite diário e flag ativo.
 * Caso a regra não exista ou esteja desativada, resolve silenciosamente.
 */
export async function awardPoints(
  resellerId: string,
  acao: string,
  tx?: Omit<
    ExtendedPrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >
) {
  const db = tx || prisma;

  const regra = await db.gamificacaoRegra.findUnique({
    where: { acao },
  });

  if (!regra || !regra.ativo || regra.pontos <= 0) return;

  const now = new Date();

  // Tipo 'unico' — só permite 1 vez na vida
  if (regra.tipo === "unico") {
    const existing = await db.pontosExtrato.count({
      where: { reseller_id: resellerId, regra_id: regra.id },
    });
    if (existing > 0) return;
  }

  // Tipo 'diario' — respeita limite diário
  if (regra.tipo === "diario" && regra.limite_diario != null) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const countToday = await db.pontosExtrato.count({
      where: {
        reseller_id: resellerId,
        regra_id: regra.id,
        created_at: { gte: startOfDay },
      },
    });
    if (countToday >= regra.limite_diario) return;
  }

  // Tipo 'mensal' — só permite 1 vez por mês
  if (regra.tipo === "mensal") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const countMonth = await db.pontosExtrato.count({
      where: {
        reseller_id: resellerId,
        regra_id: regra.id,
        created_at: { gte: startOfMonth },
      },
    });
    if (countMonth > 0) return;
  }

  await db.pontosExtrato.create({
    data: {
      reseller_id: resellerId,
      regra_id: regra.id,
      pontos: regra.pontos,
      descricao: regra.nome,
    },
  });
}
