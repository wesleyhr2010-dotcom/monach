"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

// ============================================
// Types
// ============================================

export interface PeriodCounts {
    total: number;
    diretas: number;
    revendedoras: number;
    unicos: number;
    unicos_diretas: number;
    unicos_revendedoras: number;
}

export interface AnalyticsSummary {
    hoje: PeriodCounts;
    semana: PeriodCounts;
    mes: PeriodCounts;
}

export interface DailyData {
    date: string;
    diretas: number;
    revendedoras: number;
    unicos_diretas: number;
    unicos_revendedoras: number;
}

export interface TopRevendedora {
    id: string;
    name: string;
    avatar_url: string;
    total_visitas: number;
    visitantes_unicos: number;
}

// ============================================
// Summary (Cards)
// ============================================

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
    await requireAuth(["ADMIN"]);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [hoje, semana, mes] = await Promise.all([
        getCountsForPeriod(startOfDay),
        getCountsForPeriod(startOfWeek),
        getCountsForPeriod(startOfMonth),
    ]);

    return { hoje, semana, mes };
}

async function getCountsForPeriod(since: Date): Promise<PeriodCounts> {
    const result = await prisma.$queryRawUnsafe<Array<{
        total: bigint;
        diretas: bigint;
        revendedoras: bigint;
        unicos: bigint;
        unicos_diretas: bigint;
        unicos_revendedoras: bigint;
    }>>(
        `SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE reseller_id IS NULL) as diretas,
            COUNT(*) FILTER (WHERE reseller_id IS NOT NULL) as revendedoras,
            COUNT(DISTINCT visitor_id) as unicos,
            COUNT(DISTINCT visitor_id) FILTER (WHERE reseller_id IS NULL) as unicos_diretas,
            COUNT(DISTINCT visitor_id) FILTER (WHERE reseller_id IS NOT NULL) as unicos_revendedoras
        FROM analytics_acessos
        WHERE data_acesso >= $1 AND is_bot = false`,
        since
    );

    const row = result[0];
    return {
        total: Number(row.total),
        diretas: Number(row.diretas),
        revendedoras: Number(row.revendedoras),
        unicos: Number(row.unicos),
        unicos_diretas: Number(row.unicos_diretas),
        unicos_revendedoras: Number(row.unicos_revendedoras),
    };
}

// ============================================
// Daily Chart Data (last N days)
// ============================================

export async function getAnalyticsByDay(days = 30): Promise<DailyData[]> {
    await requireAuth(["ADMIN"]);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.analyticsAcesso.findMany({
        where: { data_acesso: { gte: since }, is_bot: false },
        select: { data_acesso: true, reseller_id: true, visitor_id: true },
    });

    const map = new Map<string, {
        diretas: number;
        revendedoras: number;
        visitors_diretas: Set<string>;
        visitors_revendedoras: Set<string>;
    }>();

    for (const row of rows) {
        const dateKey = row.data_acesso.toISOString().slice(0, 10);
        if (!map.has(dateKey)) {
            map.set(dateKey, {
                diretas: 0,
                revendedoras: 0,
                visitors_diretas: new Set(),
                visitors_revendedoras: new Set(),
            });
        }
        const entry = map.get(dateKey)!;
        if (row.reseller_id) {
            entry.revendedoras++;
            if (row.visitor_id) entry.visitors_revendedoras.add(row.visitor_id);
        } else {
            entry.diretas++;
            if (row.visitor_id) entry.visitors_diretas.add(row.visitor_id);
        }
    }

    // Fill missing days
    const result: DailyData[] = [];
    const d = new Date(since);
    const today = new Date();
    while (d <= today) {
        const key = d.toISOString().slice(0, 10);
        const entry = map.get(key);
        result.push({
            date: key,
            diretas: entry?.diretas || 0,
            revendedoras: entry?.revendedoras || 0,
            unicos_diretas: entry?.visitors_diretas.size || 0,
            unicos_revendedoras: entry?.visitors_revendedoras.size || 0,
        });
        d.setDate(d.getDate() + 1);
    }

    return result;
}

// ============================================
// Top Revendedoras by Access
// ============================================

export async function getTopRevendedorasByAccess(limit = 10): Promise<TopRevendedora[]> {
    await requireAuth(["ADMIN"]);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await prisma.$queryRawUnsafe<Array<{
        reseller_id: string;
        total_visitas: bigint;
        visitantes_unicos: bigint;
    }>>(
        `SELECT
            reseller_id,
            COUNT(*) as total_visitas,
            COUNT(DISTINCT visitor_id) as visitantes_unicos
        FROM analytics_acessos
        WHERE data_acesso >= $1 AND is_bot = false AND reseller_id IS NOT NULL
        GROUP BY reseller_id
        ORDER BY total_visitas DESC
        LIMIT $2`,
        since,
        limit
    );

    if (rows.length === 0) return [];

    const resellerIds = rows.map((r) => r.reseller_id);
    const resellers = await prisma.reseller.findMany({
        where: { id: { in: resellerIds } },
        select: { id: true, name: true, avatar_url: true },
    });

    const resellerMap = new Map(resellers.map((r) => [r.id, r]));

    return rows.map((row) => {
        const r = resellerMap.get(row.reseller_id) || { id: row.reseller_id, name: "—", avatar_url: "" };
        return {
            id: r.id,
            name: r.name,
            avatar_url: r.avatar_url,
            total_visitas: Number(row.total_visitas),
            visitantes_unicos: Number(row.visitantes_unicos),
        };
    });
}
