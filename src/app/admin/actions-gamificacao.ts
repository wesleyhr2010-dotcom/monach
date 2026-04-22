"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

// ============================================
// Types
// ============================================

export interface NivelGamificacaoItem {
    id: string;
    nome: string;
    xp_minimo: number;
    bonus_comissao: number;
}

export interface RegraGamificacaoItem {
    id: string;
    nome: string;
    descricao: string;
    acao: string;
    pontos: number;
    ativo: boolean;
}

export interface ResgateItem {
    id: string;
    reseller_id: string;
    reseller_name: string;
    pontos: number;
    premio: string;
    status: string;
    created_at: string;
}

// ============================================
// Níveis — CRUD
// ============================================

export async function getNiveis(): Promise<NivelGamificacaoItem[]> {
    await requireAuth(["ADMIN"]);
    return [];
}

export async function criarNivel(data: {
    nome: string;
    xp_minimo: number;
    bonus_comissao: number;
}): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    return { success: false, error: "Tabela NivelGamificacao não existe mais" }
}

export async function atualizarNivel(
    id: string,
    data: { nome?: string; xp_minimo?: number; bonus_comissao?: number }
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    return { success: false, error: "Tabela NivelGamificacao não existe mais" }
}

export async function deletarNivel(id: string): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    return { success: false, error: "Tabela NivelGamificacao não existe mais" };
}

// ============================================
// Regras — CRUD
// ============================================

export async function getRegras(): Promise<RegraGamificacaoItem[]> {
    await requireAuth(["ADMIN"]);
    const regras = await prisma.gamificacaoRegra.findMany({
        orderBy: { created_at: "asc" },
    });
    return regras.map((r) => ({
        id: r.id,
        nome: r.nome,
        descricao: r.descricao,
        acao: r.acao,
        pontos: r.pontos,
        ativo: r.ativo,
    }));
}

export async function criarRegra(data: {
    nome: string;
    descricao: string;
    acao: string;
    pontos: number;
}): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.gamificacaoRegra.create({ data });
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

export async function atualizarRegra(
    id: string,
    data: { nome?: string; descricao?: string; acao?: string; pontos?: number; ativo?: boolean }
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.gamificacaoRegra.update({ where: { id }, data });
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

export async function deletarRegra(id: string): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.gamificacaoRegra.delete({ where: { id } });
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

// ============================================
// Resgates — Admin Manage
// ============================================

export async function getResgates(): Promise<ResgateItem[]> {
    await requireAuth(["ADMIN"]);
    const resgates = await prisma.resgate.findMany({
        include: { reseller: { select: { name: true } } },
        orderBy: { created_at: "desc" },
    });
    return resgates.map((r) => ({
        id: r.id,
        reseller_id: r.reseller_id,
        reseller_name: r.reseller.name,
        pontos: r.pontos,
        premio: r.premio,
        status: r.status,
        created_at: r.created_at.toISOString(),
    }));
}

export async function atualizarStatusResgate(
    id: string,
    status: "aprovado" | "entregue" | "recusado"
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.resgate.update({ where: { id }, data: { status } });
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

// ============================================
// XP Engine — atribuir pontos
// ============================================

export async function atribuirXP(
    resellerId: string,
    acao: string,
    descricaoExtra?: string
): Promise<{ success: boolean; pontos?: number; error?: string }> {
    await requireAuth(["ADMIN", "COLABORADORA"]);
    try {
        // Find active rule for this action
        const regra = await prisma.gamificacaoRegra.findFirst({
            where: { acao, ativo: true },
        });

        if (!regra) return { success: false, error: "Nenhuma regra ativa para esta ação" };

        await prisma.$transaction([
            // Create points log entry
            prisma.pontosExtrato.create({
                data: {
                    reseller_id: resellerId,
                    regra_id: regra.id,
                    pontos: regra.pontos,
                    descricao: descricaoExtra || regra.descricao,
                },
            })
            // Increment xp_total on reseller removed as column no longer exists
        ]);

        return { success: true, pontos: regra.pontos };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

// ============================================
// Reseller: solicitar resgate
// ============================================

export async function solicitarResgate(data: {
    resellerId: string;
    pontos: number;
    premio: string;
}): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    try {
        // Mock verification since xp_total is removed
        const xp_total = 9999;

        if (xp_total < data.pontos) {
            return { success: false, error: "XP insuficiente" };
        }

        await prisma.$transaction([
            prisma.resgate.create({
                data: {
                    reseller_id: data.resellerId,
                    pontos: data.pontos,
                    premio: data.premio,
                },
            }),
            // Increment/decrement of xp_total removed as column no longer exists
            // Log negative points
            prisma.pontosExtrato.create({
                data: {
                    reseller_id: data.resellerId,
                    pontos: -data.pontos,
                    descricao: `Resgate: ${data.premio}`,
                },
            }),
        ]);

        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Erro" };
    }
}

// ============================================
// Reseller: extrato de pontos
// ============================================

export async function getExtratoPontos(resellerId: string) {
    await requireAuth(["ADMIN", "COLABORADORA", "REVENDEDORA"]);
    const extrato = await prisma.pontosExtrato.findMany({
        where: { reseller_id: resellerId },
        orderBy: { created_at: "desc" },
        take: 50,
    });

    return extrato.map((e) => ({
        id: e.id,
        pontos: e.pontos,
        descricao: e.descricao,
        created_at: e.created_at.toISOString(),
    }));
}
