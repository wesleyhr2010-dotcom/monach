"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import type { MaletaStatus, Prisma } from "@/generated/prisma/client";

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

const PY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem DST desde 2024 (D-07)

function getSinceDate(days: number): Date {
  const nowPy = new Date(Date.now() - PY_OFFSET_MS);
  nowPy.setUTCDate(nowPy.getUTCDate() - days);
  nowPy.setUTCHours(0, 0, 0, 0);
  return new Date(nowPy.getTime() + PY_OFFSET_MS);
}

export async function getRangeFromParams(
  period?: number,
  fromStr?: string,
  toStr?: string
): Promise<{ from: Date; to: Date }> {
  if (fromStr && toStr) {
    const from = new Date(`${fromStr}T00:00:00-03:00`);
    const to = new Date(`${toStr}T23:59:59.999-03:00`);
    return { from, to };
  }

  const days = period ?? 30;
  const from = getSinceDate(days);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

// ============================================
// KPIs
// ============================================

export async function getAnalyticsKPIs(from: Date, to: Date): Promise<AnalyticsKPIs> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getMaletaResellerScope(user);

  const [ativasAgg, devolvidasPeriodo, atrasadasCount, totalPeriodo, revComMaleta, tempoMedioRaw] =
    await Promise.all([
      prisma.maleta.aggregate({
        where: { ...scope, status: "ativa" },
        _count: { id: true },
        _avg: { valor_total_enviado: true },
      }),
      prisma.maleta.count({
        where: { ...scope, status: "concluida", updated_at: { gte: from, lte: to } },
      }),
      prisma.maleta.count({
        where: { ...scope, status: "atrasada", created_at: { gte: from, lte: to } },
      }),
      prisma.maleta.count({
        where: { ...scope, created_at: { gte: from, lte: to } },
      }),
      prisma.maleta.groupBy({
        by: ["reseller_id"],
        where: { ...scope, status: "ativa" },
      }),
      prisma.$queryRawUnsafe<Array<{ avg_dias: number | null }>>(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) as avg_dias
         FROM maletas
         WHERE status = 'concluida'
         AND created_at >= $1 AND created_at <= $2
         ${user.role !== "ADMIN" ? `AND reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $3)` : ""}
        `,
        from,
        to,
        ...(user.role !== "ADMIN" ? [user.profileId] : [])
      ),
    ]);

  const taxaAtraso = totalPeriodo > 0 ? (atrasadasCount / totalPeriodo) * 100 : 0;

  return {
    maletasAtivas: ativasAgg._count.id,
    devolvidasMes: devolvidasPeriodo,
    taxaAtraso: Math.round(taxaAtraso * 10) / 10,
    ticketMedio: Number(ativasAgg._avg.valor_total_enviado ?? 0),
    revendedorasComMaleta: revComMaleta.length,
    tempoMedioDevolucaoDias: Math.round((tempoMedioRaw[0]?.avg_dias ?? 0) * 10) / 10,
  };
}

// ============================================
// Fluxo de Maletas (série temporal)
// ============================================

export async function getAnalyticsFluxoMaletas(from: Date, to: Date): Promise<FluxoDia[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  const whereClause =
    user.role === "ADMIN"
      ? `created_at >= $1 AND created_at <= $2`
      : `created_at >= $1 AND created_at <= $2 AND reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $3)`;

  const params = user.role === "ADMIN" ? [from, to] : [from, to, user.profileId];

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
  const d = new Date(from);
  const end = new Date(to);
  const rowMap = new Map(rows.map((r) => [r.dia.toISOString().slice(0, 10), r]));

  while (d <= end) {
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

export async function getAnalyticsDistribuicaoStatus(from: Date, to: Date): Promise<DistribuicaoStatus[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getMaletaResellerScope(user);

  const rows = await prisma.maleta.groupBy({
    by: ["status"],
    where: { ...scope, created_at: { gte: from, lte: to } },
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
  from: Date,
  to: Date,
  limit = 10
): Promise<TopRevendedoraVolume[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const resellerScope = getResellerScope(user);

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
      where: { reseller_id: { in: ids }, created_at: { gte: from, lte: to } },
      _count: { id: true },
      _sum: { valor_total_enviado: true },
    }),
    prisma.maleta.groupBy({
      by: ["reseller_id"],
      where: { reseller_id: { in: ids }, status: "atrasada", created_at: { gte: from, lte: to } },
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
  from: Date,
  to: Date,
  limit = 10
): Promise<ProdutoMaisVendido[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  const whereClause =
    user.role === "ADMIN"
      ? `m.created_at >= $1 AND m.created_at <= $2`
      : `m.created_at >= $1 AND m.created_at <= $2 AND m.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $3)`;

  const params = user.role === "ADMIN" ? [from, to] : [from, to, user.profileId];

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

// ============================================
// Vitrina Analytics Types
// ============================================

export interface VitrinaKPIs {
  totalVisitas: number;
  visitantesUnicos: number;
  cliquesWhatsApp: number;
  ctrCheckout: number;
  ctrContato: number;
}

export interface VitrinaDia {
  dia: string; // YYYY-MM-DD
  visitas: number;
}

export interface VitrinaRankingItem {
  id: string;
  name: string;
  avatar_url: string | null;
  visitas: number;
  visitantesUnicos: number;
  cliquesWhatsApp: number;
  ctrCheckout: number;
  ctrContato: number;
}

// ============================================
// Vitrina KPIs
// ============================================

export async function getVitrinaKPIs(from: Date, to: Date, resellerId?: string): Promise<VitrinaKPIs> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  // --- Historical: AnalyticsDiario ---
  let diarioSql = "WHERE ad.data >= $1 AND ad.data <= $2";
  const diarioParams: unknown[] = [from, to];

  if (user.role !== "ADMIN" && user.profileId) {
    diarioSql += ` AND ad.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $${diarioParams.length + 1})`;
    diarioParams.push(user.profileId);
  }
  if (resellerId) {
    diarioSql += ` AND ad.reseller_id = $${diarioParams.length + 1}`;
    diarioParams.push(resellerId);
  }

  const diarioRows = await prisma.$queryRawUnsafe<Array<{
    total_visitas: bigint;
    visitantes_unicos: bigint;
    cliques_whatsapp: bigint;
  }>>(
    `SELECT
      COALESCE(SUM(total_visitas), 0) as total_visitas,
      COALESCE(SUM(visitantes_unicos), 0) as visitantes_unicos,
      COALESCE(SUM(cliques_whatsapp), 0) as cliques_whatsapp
     FROM analytics_diario ad
     ${diarioSql}`,
    ...diarioParams
  );

  // --- Today: AnalyticsAcesso (only if today is within [from, to]) ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const includeToday = to.getTime() >= todayStart.getTime();

  let todayVisitas: [{ count: bigint }] = [{ count: BigInt(0) }];
  let todayUnicos: [{ count: bigint }] = [{ count: BigInt(0) }];
  let todayCliques: [{ count: bigint }] = [{ count: BigInt(0) }];
  let todayCheckoutClicks: [{ count: bigint }] = [{ count: BigInt(0) }];

  if (includeToday) {
    let todaySql = "WHERE aa.data_acesso >= $1";
    const todayParams: unknown[] = [todayStart];

    if (user.role !== "ADMIN" && user.profileId) {
      todaySql += ` AND aa.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $${todayParams.length + 1})`;
      todayParams.push(user.profileId);
    }
    if (resellerId) {
      todaySql += ` AND aa.reseller_id = $${todayParams.length + 1}`;
      todayParams.push(resellerId);
    }

    [todayVisitas, todayUnicos, todayCliques, todayCheckoutClicks] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM analytics_acessos aa ${todaySql} AND aa.tipo_evento = 'catalogo_revendedora'`,
        ...todayParams
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(DISTINCT visitor_id) as count FROM analytics_acessos aa ${todaySql} AND aa.tipo_evento = 'catalogo_revendedora'`,
        ...todayParams
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM analytics_acessos aa ${todaySql} AND aa.tipo_evento = 'clique_whatsapp'`,
        ...todayParams
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM analytics_acessos aa ${todaySql} AND aa.tipo_evento = 'clique_whatsapp' AND (aa.produto_id IS NULL OR aa.page_url LIKE '%/carrinho%')`,
        ...todayParams
      ),
    ]);
  }

  const totalVisitas = Number(diarioRows[0].total_visitas) + Number(todayVisitas[0].count);
  const totalUnicos = Number(diarioRows[0].visitantes_unicos) + Number(todayUnicos[0].count);
  const totalCliques = Number(diarioRows[0].cliques_whatsapp) + Number(todayCliques[0].count);
  const totalCheckoutClicks = Number(diarioRows[0].cliques_whatsapp) + Number(todayCheckoutClicks[0].count);

  const ctrContato = totalUnicos > 0 ? (totalCliques / totalUnicos) * 100 : 0;
  const ctrCheckout = totalUnicos > 0 ? (totalCheckoutClicks / totalUnicos) * 100 : 0;

  return {
    totalVisitas,
    visitantesUnicos: totalUnicos,
    cliquesWhatsApp: totalCliques,
    ctrCheckout: Math.round(ctrCheckout * 10) / 10,
    ctrContato: Math.round(ctrContato * 10) / 10,
  };
}

// ============================================
// Vitrina Visitas Series
// ============================================

export async function getVitrinaVisitasSeries(from: Date, to: Date, resellerId?: string): Promise<VitrinaDia[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  let sql = "WHERE ad.data >= $1 AND ad.data <= $2";
  const params: unknown[] = [from, to];

  if (user.role !== "ADMIN" && user.profileId) {
    sql += ` AND ad.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $${params.length + 1})`;
    params.push(user.profileId);
  }
  if (resellerId) {
    sql += ` AND ad.reseller_id = $${params.length + 1}`;
    params.push(resellerId);
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ dia: Date; visitas: bigint }>>(
    `SELECT
       ad.data AS dia,
       SUM(ad.total_visitas) AS visitas
     FROM analytics_diario ad
     ${sql}
     GROUP BY ad.data
     ORDER BY ad.data ASC`,
    ...params
  );

  // Fill missing days
  const result: VitrinaDia[] = [];
  const d = new Date(from);
  const end = new Date(to);
  const rowMap = new Map(rows.map((r) => [r.dia.toISOString().slice(0, 10), r]));

  while (d <= end) {
    const key = d.toISOString().slice(0, 10);
    const r = rowMap.get(key);
    result.push({ dia: key, visitas: Number(r?.visitas ?? 0) });
    d.setDate(d.getDate() + 1);
  }

  return result;
}

// ============================================
// Vitrina Ranking
// ============================================

export async function getVitrinaRankingRevendedoras(
  from: Date,
  to: Date,
  limit = 50
): Promise<VitrinaRankingItem[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  // Get resellers in scope
  const resellerWhere: Prisma.ResellerWhereInput = { is_active: true, role: "REVENDEDORA" };
  if (user.role === "COLABORADORA" && user.profileId) {
    resellerWhere.colaboradora_id = user.profileId;
  }

  const revendedoras = await prisma.reseller.findMany({
    where: resellerWhere,
    select: { id: true, name: true, avatar_url: true },
    orderBy: { name: "asc" },
  });

  if (revendedoras.length === 0) return [];

  const ids = revendedoras.map((r) => r.id);

  // Aggregate from AnalyticsDiario
  const aggRows = await prisma.$queryRawUnsafe<Array<{
    reseller_id: string;
    visitas: bigint;
    unicos: bigint;
    cliques: bigint;
  }>>(
    `SELECT
       reseller_id,
       COALESCE(SUM(total_visitas), 0) as visitas,
       COALESCE(SUM(visitantes_unicos), 0) as unicos,
       COALESCE(SUM(cliques_whatsapp), 0) as cliques
     FROM analytics_diario
     WHERE data >= $1 AND data <= $2 AND reseller_id = ANY($3)
     GROUP BY reseller_id`,
    from,
    to,
    ids
  );

  const aggMap = new Map(aggRows.map((r) => [r.reseller_id, r]));

  return revendedoras
    .map((r) => {
      const a = aggMap.get(r.id);
      const visitas = Number(a?.visitas ?? 0);
      const unicos = Number(a?.unicos ?? 0);
      const cliques = Number(a?.cliques ?? 0);
      const ctr = unicos > 0 ? Math.round((cliques / unicos) * 100 * 10) / 10 : 0;
      return {
        id: r.id,
        name: r.name,
        avatar_url: r.avatar_url,
        visitas,
        visitantesUnicos: unicos,
        cliquesWhatsApp: cliques,
        ctrCheckout: ctr,
        ctrContato: ctr,
      };
    })
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, limit);
}

// ============================================
// Vitrina CSV Export
// ============================================

export async function exportVitrinaAnalyticsCSV(from: Date, to: Date): Promise<string> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  let scopeSql = "WHERE ad.data >= $1 AND ad.data <= $2";
  const params: unknown[] = [from, to];

  if (user.role !== "ADMIN" && user.profileId) {
    scopeSql += ` AND ad.reseller_id IN (SELECT id FROM resellers WHERE colaboradora_id = $${params.length + 1})`;
    params.push(user.profileId);
  }

  const rows = await prisma.$queryRawUnsafe<Array<{
    slug: string;
    total_visitas: bigint;
    visitantes_unicos: bigint;
    cliques_whatsapp: bigint;
  }>>(
    `SELECT
       r.slug,
       COALESCE(SUM(ad.total_visitas), 0) as total_visitas,
       COALESCE(SUM(ad.visitantes_unicos), 0) as visitantes_unicos,
       COALESCE(SUM(ad.cliques_whatsapp), 0) as cliques_whatsapp
     FROM analytics_diario ad
     JOIN resellers r ON r.id = ad.reseller_id
     ${scopeSql}
     GROUP BY r.id, r.slug
     ORDER BY total_visitas DESC`,
    ...params
  );

  const header = "slug,periodo,total_visitas,visitantes_unicos,cliques_whatsapp,ctr_checkout,ctr_contato\n";
  const periodo = `${from.toISOString().slice(0, 10)}_a_${to.toISOString().slice(0, 10)}`;

  const lines = rows.map((row) => {
    const visitas = Number(row.total_visitas);
    const unicos = Number(row.visitantes_unicos);
    const cliques = Number(row.cliques_whatsapp);
    const ctr = unicos > 0 ? ((cliques / unicos) * 100).toFixed(1) : "0.0";
    return [
      row.slug,
      periodo,
      visitas,
      unicos,
      cliques,
      ctr,
      ctr,
    ].join(",");
  });

  return header + lines.join("\n");
}

// ============================================
// Reseller Selector Helper
// ============================================

export async function getResellersForAnalytics() {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  const where: Prisma.ResellerWhereInput = { is_active: true, role: "REVENDEDORA" };
  if (user.role === "COLABORADORA" && user.profileId) {
    where.colaboradora_id = user.profileId;
  }

  return prisma.reseller.findMany({
    where,
    select: { id: true, name: true, avatar_url: true },
    orderBy: { name: "asc" },
  });
}
