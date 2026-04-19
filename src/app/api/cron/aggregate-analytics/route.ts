import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    // Protect with CRON_SECRET
    const secret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Aggregate yesterday's data
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const dateKey = yesterday.toISOString().slice(0, 10);

        // Get all non-bot events from yesterday
        const events = await prisma.analyticsAcesso.findMany({
            where: {
                data_acesso: { gte: yesterday, lte: endOfYesterday },
                is_bot: false,
            },
            select: { reseller_id: true, tipo_evento: true, visitor_id: true },
        });

        // Group by (reseller_id, tipo_evento)
        const groups = new Map<string, { total: number; visitors: Set<string> }>();

        for (const evt of events) {
            const key = `${evt.reseller_id || "NULL"}|${evt.tipo_evento}`;
            if (!groups.has(key)) groups.set(key, { total: 0, visitors: new Set() });
            const g = groups.get(key)!;
            g.total++;
            if (evt.visitor_id) g.visitors.add(evt.visitor_id);
        }

        // Upsert into AnalyticsDiario
        let upserted = 0;
        for (const [key, data] of groups) {
            const [resellerId, tipo] = key.split("|");
            const rId = resellerId === "NULL" ? null : resellerId;

            await prisma.analyticsDiario.upsert({
                where: {
                    data_reseller_id_tipo: {
                        data: new Date(dateKey),
                        reseller_id: rId ?? "00000000-0000-0000-0000-000000000000",
                        tipo,
                    },
                },
                update: {
                    total_visitas: data.total,
                    visitantes_unicos: data.visitors.size,
                },
                create: {
                    data: new Date(dateKey),
                    reseller_id: rId,
                    tipo,
                    total_visitas: data.total,
                    visitantes_unicos: data.visitors.size,
                },
            });
            upserted++;
        }

        return NextResponse.json({
            success: true,
            date: dateKey,
            events_processed: events.length,
            groups_upserted: upserted,
        });
    } catch (err) {
        console.error("[Cron] Aggregate analytics error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
