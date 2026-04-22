import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    // Protect with CRON_SECRET (fail-closed: bloqueia se não configurado ou incorreto)
    const secret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const result = await prisma.maleta.updateMany({
            where: {
                status: "ativa",
                data_limite: { lt: now },
            },
            data: { status: "atrasada" },
        });

        return NextResponse.json({
            success: true,
            updated: result.count,
        });
    } catch (err: unknown) {
        console.error("[Cron] Check overdue maletas error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
