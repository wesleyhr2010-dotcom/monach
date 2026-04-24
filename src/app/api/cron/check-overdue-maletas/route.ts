import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificarRevendedora } from "@/lib/notifications";

export async function GET(request: NextRequest) {
    // Protect with CRON_SECRET (fail-closed: bloqueia se não configurado ou incorreto)
    const secret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const resultados = { atrasadas: 0, prazoProximo: 0 };

        // ── 1. Maletas que ficaram atrasadas ──
        const maletasAtrasadas = await prisma.maleta.findMany({
            where: {
                status: "ativa",
                data_limite: { lt: now },
            },
            select: {
                id: true,
                numero: true,
                reseller_id: true,
                reseller: { select: { auth_user_id: true } },
            },
        });

        if (maletasAtrasadas.length > 0) {
            await prisma.maleta.updateMany({
                where: {
                    id: { in: maletasAtrasadas.map((m) => m.id) },
                },
                data: { status: "atrasada" },
            });

            for (const maleta of maletasAtrasadas) {
                await notificarRevendedora({
                    reseller_id: maleta.reseller_id,
                    tipo: "maleta_atrasada",
                    titulo: "Consignación atrasada",
                    mensagem:
                        "Tu consignación está atrasada. Comunícate con tu consultora.",
                    dados: {
                        cta_url: `/app/maleta/${maleta.id}`,
                        maleta_id: maleta.id,
                    },
                    auth_user_id: maleta.reseller.auth_user_id,
                });
            }

            resultados.atrasadas = maletasAtrasadas.length;
        }

        // ── 2. Maletas com prazo próximo (2 dias) ──
        const limite2Dias = new Date(now);
        limite2Dias.setDate(limite2Dias.getDate() + 2);

        const maletasPrazoProximo = await prisma.maleta.findMany({
            where: {
                status: "ativa",
                data_limite: { gte: now, lte: limite2Dias },
            },
            select: {
                id: true,
                numero: true,
                data_limite: true,
                reseller_id: true,
                reseller: { select: { auth_user_id: true } },
            },
        });

        for (const maleta of maletasPrazoProximo) {
            // Deduplicação: só notificar se não houver notificação prazo_proximo
            // para esta maleta nas últimas 24 horas
            const vinteQuatroHorasAtras = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const jaNotificou = await prisma.notificacao.count({
                where: {
                    reseller_id: maleta.reseller_id,
                    tipo: "prazo_proximo",
                    created_at: { gte: vinteQuatroHorasAtras },
                    dados: {
                        path: ["maleta_id"],
                        equals: maleta.id,
                    },
                },
            });

            if (jaNotificou > 0) continue;

            const diasRestantes = Math.ceil(
                (maleta.data_limite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            await notificarRevendedora({
                reseller_id: maleta.reseller_id,
                tipo: "prazo_proximo",
                titulo: "¡Plazo próximo!",
                mensagem: `Tu consignación vence en ${diasRestantes} día(s). ¡No olvides devolver!`,
                dados: {
                    cta_url: `/app/maleta/${maleta.id}/devolver`,
                    maleta_id: maleta.id,
                },
                auth_user_id: maleta.reseller.auth_user_id,
            });

            resultados.prazoProximo++;
        }

        return NextResponse.json({
            success: true,
            updated: resultados.atrasadas,
            prazoProximoNotified: resultados.prazoProximo,
        });
    } catch (err: unknown) {
        console.error(
            "[Cron] Check overdue maletas error:",
            err instanceof Error ? err.message : err
        );
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
