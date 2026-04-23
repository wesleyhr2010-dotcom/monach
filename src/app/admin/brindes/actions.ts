"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { revalidatePath } from "next/cache";

// ============================================
// Schemas
// ============================================

const brindeSchema = z.object({
    nome: z.string().min(2).max(100),
    descricao: z.string().max(500).default(""),
    imagem_url: z.string().url(),
    custo_pontos: z.number().int().positive(),
    estoque: z.number().int().min(-1), // -1 = ilimitado
    ativo: z.boolean().default(true),
});

// ============================================
// Brindes — Admin CRUD
// ============================================

export async function getBrindes() {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    return prisma.brinde.findMany({
        orderBy: [{ ativo: "desc" }, { custo_pontos: "asc" }],
    });
}

export async function getBrindeById(id: string) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    return prisma.brinde.findUnique({ where: { id } });
}

export async function criarBrinde(rawData: z.infer<typeof brindeSchema>) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    const data = brindeSchema.parse(rawData);
    const brinde = await prisma.brinde.create({ data });
    revalidatePath("/admin/brindes");
    return brinde;
}

export async function atualizarBrinde(
    id: string,
    rawData: Partial<z.infer<typeof brindeSchema>>
) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    const data = brindeSchema.partial().parse(rawData);
    const brinde = await prisma.brinde.update({ where: { id }, data });
    revalidatePath("/admin/brindes");
    return brinde;
}

export async function toggleBrindeAtivo(id: string, ativo: boolean) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    const brinde = await prisma.brinde.update({
        where: { id },
        data: { ativo },
    });
    revalidatePath("/admin/brindes");
    return brinde;
}

// ============================================
// Solicitações — Admin
// ============================================

export async function getSolicitacoes(status?: string) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    return prisma.solicitacaoBrinde.findMany({
        where: status ? { status } : undefined,
        include: {
            reseller: { select: { id: true, name: true, colaboradora_id: true } },
            brinde: true,
        },
        orderBy: { created_at: "desc" },
    });
}

export async function getSolicitacoesPendentesCount() {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    return prisma.solicitacaoBrinde.count({
        where: { status: "pendente" },
    });
}

export async function marcarSeparado(id: string) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    await prisma.solicitacaoBrinde.update({
        where: { id },
        data: { status: "separado" },
    });
    revalidatePath("/admin/brindes/solicitudes");
}

export async function marcarEntregado(id: string) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    const solicitud = await prisma.solicitacaoBrinde.update({
        where: { id },
        data: { status: "entregado" },
        include: { reseller: true, brinde: true },
    });

    // Notificar revendedora (best-effort)
    try {
        const { sendPushNotification } = await import("@/lib/onesignal-server");
        if (solicitud.reseller.auth_user_id) {
            await sendPushNotification(
                [solicitud.reseller.auth_user_id],
                "¡Tu regalo llegó!",
                `🎁 ${solicitud.brinde.nome} fue entregado. ¡Disfrútalo!`
            );
        }
    } catch {
        // Best-effort: não falhar se notificação falhar
    }

    revalidatePath("/admin/brindes/solicitudes");
    return solicitud;
}

export async function cancelarSolicitacion(id: string) {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    await prisma.$transaction(async (tx) => {
        const solicitud = await tx.solicitacaoBrinde.findUniqueOrThrow({
            where: { id },
            include: { brinde: true },
        });

        if (solicitud.status === "entregado") {
            throw new Error("BUSINESS: No se puede cancelar una solicitud ya entregada.");
        }

        // Reembolsar pontos
        await tx.pontosExtrato.create({
            data: {
                reseller_id: solicitud.reseller_id,
                pontos: solicitud.pontos_debitados,
                descricao: `Reembolso: ${solicitud.brinde.nome}`,
            },
        });

        // Devolver estoque se não for ilimitado
        if (solicitud.brinde.estoque >= 0) {
            await tx.brinde.update({
                where: { id: solicitud.brinde_id },
                data: { estoque: { increment: 1 } },
            });
        }

        // Atualizar status
        await tx.solicitacaoBrinde.update({
            where: { id },
            data: { status: "cancelado" },
        });
    });

    revalidatePath("/admin/brindes/solicitudes");
}
