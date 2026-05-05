"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { getDateRange, type TimeRange } from "@/lib/date-range";
import { ActionResult, safeAction } from "@/lib/action-utils";

interface Metrics {
  accesos: number;
  visitantes_unicos: number;
  cliques_whatsapp: number;
  pecas_vendidas: number;
}

interface Variacao {
  accesos_pct: number | null;
  visitantes_pct: number | null;
  cliques_pct: number | null;
  pecas_pct: number | null;
}

interface GraficoPoint {
  dia: string;
  visitas: number;
}

interface ProductoPop {
  id: string;
  nome: string;
  imagem_url: string | null;
  visitas: number;
}

interface DesempenhoResult {
  actual: Metrics;
  anterior: Metrics;
  variacao: Variacao;
  grafico: GraficoPoint[];
  productos: ProductoPop[];
}

function calcVariacaoPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

async function getMetricasPeriodo(
  resellerId: string,
  start: Date,
  end: Date,
  isShortRange: boolean
): Promise<Metrics> {
  if (isShortRange) {
    const [accesosRaw, visitantesRaw, cliquesRaw, pecasRaw] = await Promise.all([
      prisma.analyticsAcesso.count({
        where: {
          reseller_id: resellerId,
          tipo_evento: "catalogo_revendedora",
          data_acesso: { gte: start, lte: end },
          is_bot: false,
        },
      }),
      prisma.analyticsAcesso.groupBy({
        by: ["visitor_id"],
        where: {
          reseller_id: resellerId,
          data_acesso: { gte: start, lte: end },
          is_bot: false,
          visitor_id: { not: null },
        },
        _count: { visitor_id: true },
      }),
      prisma.analyticsAcesso.count({
        where: {
          reseller_id: resellerId,
          tipo_evento: "clique_whatsapp",
          data_acesso: { gte: start, lte: end },
          is_bot: false,
        },
      }),
      prisma.vendaMaleta.count({
        where: {
          maleta: { reseller_id: resellerId },
          created_at: { gte: start, lte: end },
        },
      }),
    ]);

    return {
      accesos: accesosRaw,
      visitantes_unicos: visitantesRaw.length,
      cliques_whatsapp: cliquesRaw,
      pecas_vendidas: pecasRaw,
    };
  }

  // Use pre-aggregated AnalyticsDiario for longer ranges
  const agg = await prisma.analyticsDiario.aggregate({
    _sum: {
      total_visitas: true,
      visitantes_unicos: true,
      cliques_whatsapp: true,
    },
    where: {
      reseller_id: resellerId,
      data: { gte: start, lte: end },
    },
  });

  const pecasRaw = await prisma.vendaMaleta.count({
    where: {
      maleta: { reseller_id: resellerId },
      created_at: { gte: start, lte: end },
    },
  });

  return {
    accesos: agg._sum.total_visitas ?? 0,
    visitantes_unicos: agg._sum.visitantes_unicos ?? 0,
    cliques_whatsapp: agg._sum.cliques_whatsapp ?? 0,
    pecas_vendidas: pecasRaw,
  };
}

async function getVisitasDiarias(
  resellerId: string,
  start: Date,
  end: Date
): Promise<GraficoPoint[]> {
  const rows = await prisma.analyticsDiario.findMany({
    where: {
      reseller_id: resellerId,
      data: { gte: start, lte: end },
    },
    orderBy: { data: "asc" },
    select: {
      data: true,
      total_visitas: true,
    },
  });

  const diasSemana = ["D", "L", "M", "X", "J", "V", "S"];

  return rows.map((r) => {
    const d = new Date(r.data);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let diaLabel: string;
    if (diffDays <= 7) {
      diaLabel = diasSemana[d.getDay()];
    } else {
      diaLabel = new Intl.DateTimeFormat("es-PY", {
        day: "2-digit",
        month: "short",
        timeZone: "America/Asuncion",
      }).format(d);
    }

    return {
      dia: diaLabel,
      visitas: r.total_visitas,
    };
  });
}

async function getProductosPopulares(
  resellerId: string,
  start: Date,
  end: Date
): Promise<ProductoPop[]> {
  const rows = await prisma.analyticsAcesso.groupBy({
    by: ["produto_id"],
    where: {
      reseller_id: resellerId,
      tipo_evento: "catalogo_revendedora",
      data_acesso: { gte: start, lte: end },
      is_bot: false,
      produto_id: { not: null },
    },
    _count: { produto_id: true },
    orderBy: { _count: { produto_id: "desc" } },
    take: 10,
  });

  const produtoIds = rows
    .map((r) => r.produto_id)
    .filter((id): id is string => id !== null);

  if (produtoIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: produtoIds } },
    select: {
      id: true,
      name: true,
      images: true,
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return rows
    .map((r) => {
      const prod = r.produto_id ? productMap.get(r.produto_id) : undefined;
      return {
        id: r.produto_id ?? "",
        nome: prod?.name ?? "Producto",
        imagem_url: prod?.images[0] ?? null,
        visitas: r._count.produto_id,
      };
    })
    .filter((p) => p.id !== "");
}

export async function getMetricasDesempenho(
  resellerId: string,
  rango: TimeRange
): Promise<ActionResult<DesempenhoResult>> {
  return safeAction(async () => {
    const user = await requireAuth(["REVENDEDORA"]);

    if (user.profileId !== resellerId) {
      throw new Error("No autorizado para ver estos datos");
    }

    const { start, end, prevStart, prevEnd } = getDateRange(rango);
    const diffMs = end.getTime() - start.getTime();
    const isShortRange = diffMs <= 7 * 24 * 60 * 60 * 1000;

    const [actual, anterior, grafico, productos] = await Promise.all([
      getMetricasPeriodo(resellerId, start, end, isShortRange),
      getMetricasPeriodo(resellerId, prevStart, prevEnd, isShortRange),
      getVisitasDiarias(resellerId, start, end),
      getProductosPopulares(resellerId, start, end),
    ]);

    return {
      actual,
      anterior,
      variacao: {
        accesos_pct: calcVariacaoPct(actual.accesos, anterior.accesos),
        visitantes_pct: calcVariacaoPct(actual.visitantes_unicos, anterior.visitantes_unicos),
        cliques_pct: calcVariacaoPct(actual.cliques_whatsapp, anterior.cliques_whatsapp),
        pecas_pct: calcVariacaoPct(actual.pecas_vendidas, anterior.pecas_vendidas),
      },
      grafico,
      productos,
    };
  });
}
