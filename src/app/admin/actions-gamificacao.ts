"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

// ============================================
// Schemas
// ============================================

const updateRegraSchema = z.object({
    nome: z.string().min(3).max(80),
    descricao: z.string().max(200),
    pontos: z.number().int().min(1).max(10000),
    ativo: z.boolean(),
    icone: z.string(),
    ordem: z.number().int(),
    limite_diario: z.number().int().min(1).nullable(),
    meta_valor: z.number().positive().nullable(),
});

const nivelSchema = z.object({
    id: z.string().uuid().optional(),
    nome: z.string().min(2).max(40),
    pontos_minimos: z.number().int().min(0),
    cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    ordem: z.number().int(),
});

// ============================================
// Regras — Admin CRUD
// ============================================

export async function getRegras() {
    await requireAuth(["ADMIN"]);
    return prisma.gamificacaoRegra.findMany({
        orderBy: { ordem: "asc" },
    });
}

export async function atualizarRegra(
    id: string,
    rawData: z.infer<typeof updateRegraSchema>
) {
    await requireAuth(["ADMIN"]);
    const data = updateRegraSchema.parse(rawData);
    return prisma.gamificacaoRegra.update({
        where: { id },
        data,
    });
}

// ============================================
// Níveis — Admin CRUD
// ============================================

export async function getNiveis() {
    await requireAuth(["ADMIN"]);
    return prisma.nivelRegra.findMany({
        orderBy: { ordem: "asc" },
    });
}

export async function upsertNivelRegra(rawData: z.infer<typeof nivelSchema>) {
    await requireAuth(["ADMIN"]);
    const data = nivelSchema.parse(rawData);

    if (data.id) {
        // Não permitir deletar o nível base (Bronze)
        const existing = await prisma.nivelRegra.findUnique({
            where: { id: data.id },
        });
        if (existing && existing.pontos_minimos === 0 && data.pontos_minimos !== 0) {
            throw new Error("BUSINESS: No se puede cambiar el umbral del nivel base (Bronce).");
        }
        return prisma.nivelRegra.update({
            where: { id: data.id },
            data,
        });
    }

    return prisma.nivelRegra.create({ data });
}

export async function deleteNivelRegra(id: string) {
    await requireAuth(["ADMIN"]);
    const nivel = await prisma.nivelRegra.findUnique({ where: { id } });
    if (!nivel) throw new Error("BUSINESS: Nível no encontrado.");
    if (nivel.pontos_minimos === 0) {
        throw new Error("BUSINESS: No se puede eliminar el nivel base (Bronce).");
    }
    return prisma.nivelRegra.delete({ where: { id } });
}

// ============================================
// Resgates — Admin Manage (legado)
// ============================================

export async function getResgates() {
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
) {
    await requireAuth(["ADMIN"]);
    return prisma.resgate.update({ where: { id }, data: { status } });
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
