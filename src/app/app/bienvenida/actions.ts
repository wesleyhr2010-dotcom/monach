"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { awardPoints } from "@/lib/gamificacao";

const quickProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    whatsapp: z.string().min(8).max(20).optional(),
    avatar_url: z.string().url().optional(),
});

export async function awardPrimeiroAcesso(): Promise<{ awarded: boolean; pontos: number }> {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    // Verificar se já foi concedido
    const existing = await prisma.pontosExtrato.findFirst({
        where: {
            reseller_id: resellerId,
            regra: { acao: "primeiro_acesso" },
        },
    });

    if (existing) {
        return { awarded: false, pontos: 0 };
    }

    await awardPoints(resellerId, "primeiro_acesso");

    const regra = await prisma.gamificacaoRegra.findUnique({
        where: { acao: "primeiro_acesso" },
        select: { pontos: true },
    });

    return { awarded: true, pontos: regra?.pontos ?? 50 };
}

export async function completeOnboarding(
    profileData?: { name?: string; whatsapp?: string; avatar_url?: string }
): Promise<{ success: boolean; perfilCompleto: boolean; pontosPerfil: number }> {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    // Validar dados opcionais
    if (profileData) {
        quickProfileSchema.parse(profileData);
    }

    // Atualizar perfil se dados fornecidos
    if (profileData && Object.keys(profileData).length > 0) {
        await prisma.reseller.update({
            where: { id: resellerId },
            data: {
                ...(profileData.name && { name: profileData.name }),
                ...(profileData.whatsapp && { whatsapp: profileData.whatsapp }),
                ...(profileData.avatar_url && { avatar_url: profileData.avatar_url }),
            },
        });
    }

    // Marcar onboarding como completo
    await prisma.reseller.update({
        where: { id: resellerId },
        data: { onboarding_completo: true },
    });

    // Verificar se perfil está completo para gamificação
    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        include: { dados_bancarios: true },
    });

    const perfilCompleto = !!(
        reseller?.avatar_url &&
        reseller?.whatsapp &&
        reseller?.name &&
        reseller?.dados_bancarios
    );

    let pontosPerfil = 0;

    if (perfilCompleto) {
        const alreadyAwarded = await prisma.pontosExtrato.findFirst({
            where: {
                reseller_id: resellerId,
                regra: { acao: "perfil_completo" },
            },
        });

        if (!alreadyAwarded) {
            await awardPoints(resellerId, "perfil_completo");
            const regra = await prisma.gamificacaoRegra.findUnique({
                where: { acao: "perfil_completo" },
                select: { pontos: true },
            });
            pontosPerfil = regra?.pontos ?? 100;
        }
    }

    return { success: true, perfilCompleto, pontosPerfil };
}

export async function getOnboardingStatus(): Promise<{
    id: string;
    name: string;
    onboarding_completo: boolean;
    hasMaletas: boolean;
    pontosPrimeiroAcesso: number;
    whatsapp?: string;
    avatar_url?: string;
}> {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: {
            name: true,
            onboarding_completo: true,
            whatsapp: true,
            avatar_url: true,
            _count: { select: { maletas: true } },
        },
    });

    if (!reseller) {
        throw new Error("BUSINESS: Perfil no encontrado.");
    }

    const regra = await prisma.gamificacaoRegra.findUnique({
        where: { acao: "primeiro_acesso" },
        select: { pontos: true },
    });

    return {
        id: resellerId,
        name: reseller.name,
        onboarding_completo: reseller.onboarding_completo,
        hasMaletas: reseller._count.maletas > 0,
        pontosPrimeiroAcesso: regra?.pontos ?? 50,
        whatsapp: reseller.whatsapp || undefined,
        avatar_url: reseller.avatar_url || undefined,
    };
}
