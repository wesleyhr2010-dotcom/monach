"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import type { MaletaStatus } from "@/generated/prisma/client";

// ============================================
// Types
// ============================================

export interface AnalyticsKPIs {
  maletasAtivas: number;
  devolvidasMes: number;
  taxaAtraso: number;
  ticketMedio: number;
  revendedorasComMaleta: number;
  tempoMedioDevolucaoDias: number;
}

export interface FluxoDia {
  dia: string; // YYYY-MM-DD
  enviadas: number;
  devolvidas: number;
  atrasadas: number;
}

export interface DistribuicaoStatus {
  status: MaletaStatus;
  count: number;
}

export interface TopRevendedoraVolume {
  id: string;
  name: string;
  avatar_url: string | null;
  maletasAtivas: number;
  valorEmMaleta: number;
  atrasosHistoricos: number;
  statusAtual: string;
}

export interface AlertaPrazo {
  id: string;
  numero: number;
  revendedoraNome: string;
  consultoraNome: string;
  dataLimite: Date;
  diasRestantes: number;
}

export interface ProdutoMaisVendido {
  id: string;
  nome: string;
  unidadesVendidas: number;
  valorTotal: number;
}

// ============================================
// Scope Helpers
// ============================================

function getMaletaResellerScope(user: Awaited<ReturnType<typeof requireAuth>>) {
  if (user.role === "ADMIN") return {};
  return { reseller: { colaboradora_id: user.profileId } };
}

function getResellerScope(user: Awaited<ReturnType<typeof requireAuth>>) {
  if (user.role === "ADMIN") return {};
  return { colaboradora_id: user.profileId };
}

function getSinceDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonthDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ============================================
// KPIs
// ============================================

export async function getAnalyticsKPIs(periodDays = 30): Promise<AnalyticsKPIs> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getMaletaResellerScope(user);
  const since = getSinceDate(periodDays);
  const inicioMes = startOfMonthDate();

  const [ativasAgg, devolvidasMes, atrasadasCount, totalPeriodo, revComMaleta, tempoMedioRaw] =
    await Promise.all([
      prisma.maleta.aggregate({
        where: { ...scope, status: "ativa" },
        _count: { id: true },
        _avg: { valor_total_enviado: true },
      }),
      prisma.maleta.count({
        where: { ...scope, status: "concluida", updated_at: { gte: inicioMes } },
      }),
      prisma.maleta.count({
        where: { ...scope, status: "atrasada", created_at: { gte: since } },
      }),
      prisma.maleta.count({
        where: { ...scope, created_at: { gte: since } },
      }),
      prisma.maleta.groupBy({
        by: ["reseller_id"],
        where: { ...scope, status: "ativa" },
      }),
      prisma.$queryRawUnsafe<Array<{ avg_dias: number | null }>>(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) as avg_dias
         FROM maletas
         WHERE status = 'concluida'
         AND created_at >= $1
         ${user.role !== "ADMIN" ? `AND reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $2)` : ""}
        `,
        since,
        ...(user.role !== "ADMIN" ? [user.profileId] : [])
      ),
    ]);

  const taxaAtraso = totalPeriodo > 0 ? (atrasadasCount / totalPeriodo) * 100 : 0;

  return {
    maletasAtivas: ativasAgg._count.id,
    devolvidasMes,
    taxaAtraso: Math.round(taxaAtraso * 10) / 10,
    ticketMedio: Number(ativasAgg._avg.valor_total_enviado ?? 0),
    revendedorasComMaleta: revComMaleta.length,
    tempoMedioDevolucaoDias: Math.round((tempoMedioRaw[0]?.avg_dias ?? 0) * 10) / 10,
  };
}

// ============================================
// Fluxo de Maletas (série temporal)
// ============================================

export async function getAnalyticsFluxoMaletas(periodDays = 30): Promise<FluxoDia[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const since = getSinceDate(periodDays);

  const whereClause =
    user.role === "ADMIN"
      ? `created_at >= $1`
      : `created_at >= $1 AND reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $2)`;

  const params = user.role === "ADMIN" ? [since] : [since, user.profileId];

  const rows = await prisma.$queryRawUnsafe<Array<{ dia: Date; enviadas: bigint; devolvidas: bigint; atrasadas: bigint }>>(
    `SELECT
       DATE(created_at AT TIME ZONE 'America/Asuncion') AS dia,
       COUNT(*) FILTER (WHERE status = 'ativa') AS enviadas,
       COUNT(*) FILTER (WHERE status = 'concluida') AS devolvidas,
       COUNT(*) FILTER (WHERE status = 'atrasada') AS atrasadas
     FROM maletas
     WHERE ${whereClause}
     GROUP BY dia
     ORDER BY dia ASC`,
    ...params
  );

  // Preencher dias faltantes
  const result: FluxoDia[] = [];
  const d = new Date(since);
  const today = new Date();
  const rowMap = new Map(rows.map((r) => [r.dia.toISOString().slice(0, 10), r]));

  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    const r = rowMap.get(key);
    result.push({
      dia: key,
      enviadas: Number(r?.enviadas ?? 0),
      devolvidas: Number(r?.devolvidas ?? 0),
      atrasadas: Number(r?.atrasadas ?? 0),
    });
    d.setDate(d.getDate() + 1);
  }

  return result;
}

// ============================================
// Distribuição por Status
// ============================================

export async function getAnalyticsDistribuicaoStatus(): Promise<DistribuicaoStatus[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getMaletaResellerScope(user);

  const rows = await prisma.maleta.groupBy({
    by: ["status"],
    where: scope,
    _count: { id: true },
  });

  return rows.map((r) => ({
    status: r.status,
    count: r._count.id,
  }));
}

// ============================================
// Top Revendedoras por Volume
// ============================================

export async function getAnalyticsTopRevendedoras(
  periodDays = 30,
  limit = 10
): Promise<TopRevendedoraVolume[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const resellerScope = getResellerScope(user);
  const since = getSinceDate(periodDays);

  // Buscar revendedoras do escopo com métricas
  const revendedoras = await prisma.reseller.findMany({
    where: resellerScope,
    select: {
      id: true,
      name: true,
      avatar_url: true,
    },
  });

  if (revendedoras.length === 0) return [];

  const ids = revendedoras.map((r) => r.id);

  const [maletasAgg, atrasosAgg] = await Promise.all([
    prisma.maleta.groupBy({
      by: ["reseller_id", "status"],
      where: { reseller_id: { in: ids }, created_at: { gte: since } },
      _count: { id: true },
      _sum: { valor_total_enviado: true },
    }),
    prisma.maleta.groupBy({
      by: ["reseller_id"],
      where: { reseller_id: { in: ids }, status: "atrasada" },
      _count: { id: true },
    }),
  ]);

  // Agregar por revendedora
  const stats = new Map<
    string,
    { maletasAtivas: number; valorEmMaleta: number; atrasos: number; hasAtiva: boolean; hasAtrasada: boolean }
  >();

  for (const row of maletasAgg) {
    const s = stats.get(row.reseller_id) || { maletasAtivas: 0, valorEmMaleta: 0, atrasos: 0, hasAtiva: false, hasAtrasada: false };
    if (row.status === "ativa") {
      s.maletasAtivas += row._count.id;
      s.hasAtiva = true;
      s.valorEmMaleta += Number(row._sum.valor_total_enviado ?? 0);
    }
    if (row.status === "atrasada") {
      s.hasAtrasada = true;
    }
    stats.set(row.reseller_id, s);
  }

  for (const row of atrasosAgg) {
    const s = stats.get(row.reseller_id) || { maletasAtivas: 0, valorEmMaleta: 0, atrasos: 0, hasAtiva: false, hasAtrasada: false };
    s.atrasos += row._count.id;
    stats.set(row.reseller_id, s);
  }

  return revendedoras
    .map((r) => {
      const s = stats.get(r.id) || { maletasAtivas: 0, valorEmMaleta: 0, atrasos: 0, hasAtiva: false, hasAtrasada: false };
      let statusAtual = "Sin maleta";
      if (s.hasAtrasada) statusAtual = "Atrasada";
      else if (s.hasAtiva) statusAtual = "Ativa";

      return {
        id: r.id,
        name: r.name,
        avatar_url: r.avatar_url,
        maletasAtivas: s.maletasAtivas,
        valorEmMaleta: s.valorEmMaleta,
        atrasosHistoricos: s.atrasos,
        statusAtual,
      };
    })
    .sort((a, b) => b.valorEmMaleta - a.valorEmMaleta)
    .slice(0, limit);
}

// ============================================
// Alertas de Prazo (≤ 7 dias)
// ============================================

export async function getAnalyticsAlertasPrazo(): Promise<AlertaPrazo[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getMaletaResellerScope(user);
  const limite = new Date();
  limite.setDate(limite.getDate() + 7);

  const maletas = await prisma.maleta.findMany({
    where: {
      ...scope,
      status: "ativa",
      data_limite: { lte: limite },
    },
    include: {
      reseller: {
        select: {
          name: true,
          colaboradora: { select: { name: true } },
        },
      },
    },
    orderBy: { data_limite: "asc" },
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return maletas.map((m) => {
    const diffMs = m.data_limite.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      id: m.id,
      numero: m.numero,
      revendedoraNome: m.reseller.name,
      consultoraNome: m.reseller.colaboradora?.name ?? "—",
      dataLimite: m.data_limite,
      diasRestantes,
    };
  });
}

// ============================================
// Produtos Mais Vendidos
// ============================================

export async function getAnalyticsProdutosMaisVendidos(
  periodDays = 30,
  limit = 10
): Promise<ProdutoMaisVendido[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const since = getSinceDate(periodDays);

  const whereClause =
    user.role === "ADMIN"
      ? `m.created_at >= $1`
      : `m.created_at >= $1 AND m.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $2)`;

  const params = user.role === "ADMIN" ? [since] : [since, user.profileId];

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      nome: string;
      unidades_vendidas: bigint;
      valor_total: number | null;
    }>
  >(
    `SELECT
       p.id,
       p.name AS nome,
       SUM(vm.quantidade) AS unidades_vendidas,
       SUM(vm.quantidade * vm.preco_unitario) AS valor_total
     FROM vendas_maleta vm
     JOIN maletas m ON m.id = vm.maleta_id
     JOIN maleta_itens mi ON mi.id = vm.maleta_item_id
     JOIN product_variants pv ON pv.id = mi.product_variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE ${whereClause}
     GROUP BY p.id, p.name
     ORDER BY unidades_vendidas DESC
     LIMIT ${limit}`,
    ...params
  );

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    unidadesVendidas: Number(r.unidades_vendidas),
    valorTotal: Number(r.valor_total ?? 0),
  }));
}
