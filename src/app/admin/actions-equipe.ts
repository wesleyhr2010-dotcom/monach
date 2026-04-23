"use server";

import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/action-utils";
import { uploadAvatar } from "@/lib/upload";
import { requireAuth } from "@/lib/user";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";
import type { ColaboradoraItem, RevendedoraItem } from "@/lib/types";
export type { ColaboradoraItem, RevendedoraItem } from "@/lib/types";

// ============================================
// List Colaboradoras (com métricas agregadas)
// ============================================

export async function getColaboradoras(): Promise<ColaboradoraItem[]> {
    await requireAuth(["ADMIN"]);
    const data = await prisma.reseller.findMany({
        where: { role: "COLABORADORA" },
        orderBy: { name: "asc" },
        include: {
            _count: { select: { revendedoras_sob_mim: true } },
            revendedoras_sob_mim: {
                include: {
                    maletas: {
                        where: { status: { in: ["concluida", "aguardando_revisao"] } },
                        select: { valor_total_vendido: true },
                    },
                },
            },
        },
    });

    return data.map((r) => {
        const faturamentoGrupo = r.revendedoras_sob_mim.reduce((sum, rev) => {
            return sum + rev.maletas.reduce((s, m) => s + Number(m.valor_total_vendido || 0), 0);
        }, 0);
        const ativas = r.revendedoras_sob_mim.filter((rev) => rev.is_active).length;
        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            whatsapp: r.whatsapp,
            email: r.email,
            avatar_url: r.avatar_url,
            taxa_comissao: Number(r.taxa_comissao),
            is_active: r.is_active,
            revendedorasCount: r._count.revendedoras_sob_mim,
            revendedorasAtivas: ativas,
            faturamentoGrupo,
        };
    });
}

// ============================================
// List Revendedoras
// ============================================

export async function getRevendedoras(): Promise<RevendedoraItem[]> {
    const user = await requireAuth(["ADMIN", "COLABORADORA"]);
    const where: Record<string, unknown> = { role: "REVENDEDORA" };
    if (user.role === "COLABORADORA" && user.profileId) {
        where.colaboradora_id = user.profileId;
    }
    const data = await prisma.reseller.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
            colaboradora: { select: { id: true, name: true } },
        },
    });

    return data.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        whatsapp: r.whatsapp,
        email: r.email,
        avatar_url: r.avatar_url,
        taxa_comissao: Number(r.taxa_comissao),
        is_active: r.is_active,
        colaboradora: r.colaboradora ? { id: r.colaboradora.id, name: r.colaboradora.name } : null,
    }));
}

// ============================================
// Create Colaboradora
// ============================================

export async function criarColaboradora(formData: FormData): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        const name = formData.get("name") as string;
        const whatsapp = formData.get("whatsapp") as string;
        const email = (formData.get("email") as string) || "";
        const taxaStr = formData.get("taxa_comissao") as string;
        const taxa_comissao = taxaStr ? parseFloat(taxaStr) : 0;
        const slug = generateSlug(name);

        let avatar_url = "";
        const avatarFile = formData.get("avatar") as File;
        if (avatarFile && avatarFile.size > 0) {
            avatar_url = await uploadAvatar(avatarFile, slug);
        }

        await prisma.reseller.create({
            data: {
                name,
                slug,
                whatsapp,
                email,
                avatar_url,
                taxa_comissao,
                role: "COLABORADORA",
            },
        });

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        if (msg.includes("Unique constraint")) return { success: false, error: "Já existe com este nome/slug" };
        return { success: false, error: msg };
    }
}

// ============================================
// Create Revendedora
// ============================================

export async function criarRevendedora(formData: FormData): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        const name = formData.get("name") as string;
        const whatsapp = formData.get("whatsapp") as string;
        const email = (formData.get("email") as string) || "";
        const taxaStr = formData.get("taxa_comissao") as string;
        const taxa_comissao = taxaStr ? parseFloat(taxaStr) : 0;
        const colaboradora_id = (formData.get("colaboradora_id") as string) || null;
        const slug = generateSlug(name);

        let avatar_url = "";
        const avatarFile = formData.get("avatar") as File;
        if (avatarFile && avatarFile.size > 0) {
            avatar_url = await uploadAvatar(avatarFile, slug);
        }

        await prisma.reseller.create({
            data: {
                name,
                slug,
                whatsapp,
                email,
                avatar_url,
                taxa_comissao,
                role: "REVENDEDORA",
                colaboradora_id: colaboradora_id || null,
            },
        });

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        if (msg.includes("Unique constraint")) return { success: false, error: "Já existe com este nome/slug" };
        return { success: false, error: msg };
    }
}

// ============================================
// Update Member
// ============================================

export async function atualizarMembro(
    id: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        const name = formData.get("name") as string;
        const whatsapp = formData.get("whatsapp") as string;
        const email = (formData.get("email") as string) || "";
        const taxaStr = formData.get("taxa_comissao") as string;
        const taxa_comissao = taxaStr ? parseFloat(taxaStr) : 0;
        const is_active = formData.get("is_active") === "true";
        const colaboradora_id = (formData.get("colaboradora_id") as string) || null;

        const updates: Record<string, unknown> = {
            name,
            whatsapp,
            email,
            taxa_comissao,
            is_active,
            colaboradora_id: colaboradora_id || null,
        };

        const avatarFile = formData.get("avatar") as File;
        if (avatarFile && avatarFile.size > 0) {
            const existing = await prisma.reseller.findUnique({ where: { id }, select: { slug: true } });
            updates.avatar_url = await uploadAvatar(avatarFile, existing?.slug || id);
        }

        await prisma.reseller.update({ where: { id }, data: updates });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Delete Member
// ============================================

export async function deletarMembro(id: string): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.reseller.delete({ where: { id } });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Link Revendedora → Colaboradora
// ============================================

export async function vincularRevendedora(
    revendedoraId: string,
    colaboradoraId: string | null
): Promise<{ success: boolean; error?: string }> {
    await requireAuth(["ADMIN"]);
    try {
        await prisma.reseller.update({
            where: { id: revendedoraId },
            data: { colaboradora_id: colaboradoraId || null },
        });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Perfil Detalhado — Revendedora
// ============================================

import type { RevendedoraPerfil, ConsultoraPerfil } from "@/lib/types";

export async function getPerfilRevendedora(id: string): Promise<RevendedoraPerfil | null> {
    const user = await requireAuth(["ADMIN", "COLABORADORA"]);
    if (user.role === "COLABORADORA") {
        await assertIsInGroup(id, user.profileId!);
    }
    const r = await prisma.reseller.findUnique({
        where: { id, role: "REVENDEDORA" },
        include: {
            colaboradora: { select: { id: true, name: true } },
            dados_bancarios: true,
            maletas: {
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    numero: true,
                    status: true,
                    data_envio: true,
                    data_limite: true,
                    valor_total_vendido: true,
                    valor_comissao_revendedora: true,
                },
            },
            documentos: {
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    tipo: true,
                    url: true,
                    status: true,
                    observacao: true,
                    created_at: true,
                },
            },
        },
    });
    if (!r) return null;

    const pontosAgg = await prisma.pontosExtrato.aggregate({
        where: { reseller_id: id },
        _sum: { pontos: true },
    });

    const nivel = await prisma.nivelRegra.findFirst({
        where: {
            pontos_minimos: { lte: pontosAgg._sum.pontos || 0 },
            ativo: true,
        },
        orderBy: { pontos_minimos: "desc" },
        select: { nome: true, cor: true, pontos_minimos: true },
    });

    return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        whatsapp: r.whatsapp,
        email: r.email,
        avatar_url: r.avatar_url,
        bio: r.bio,
        taxa_comissao: Number(r.taxa_comissao),
        is_active: r.is_active,
        perfil_completo: r.perfil_completo,
        onboarding_completo: r.onboarding_completo,
        cedula: r.cedula,
        instagram: r.instagram,
        edad: r.edad,
        estado_civil: r.estado_civil,
        hijos: r.hijos,
        empresa: r.empresa,
        informconf: r.informconf,
        endereco_cep: r.endereco_cep,
        endereco_logradouro: r.endereco_logradouro,
        endereco_numero: r.endereco_numero,
        endereco_complemento: r.endereco_complemento,
        endereco_cidade: r.endereco_cidade,
        endereco_estado: r.endereco_estado,
        colaboradora: r.colaboradora ? { id: r.colaboradora.id, name: r.colaboradora.name } : null,
        pontos_total: pontosAgg._sum.pontos || 0,
        nivel: nivel || null,
        dados_bancarios: r.dados_bancarios
            ? {
                tipo: r.dados_bancarios.tipo,
                alias_valor: r.dados_bancarios.alias_valor,
                alias_titular: r.dados_bancarios.alias_titular,
                alias_ci_ruc: r.dados_bancarios.alias_ci_ruc,
                banco: r.dados_bancarios.banco,
                cuenta: r.dados_bancarios.cuenta,
                titular: r.dados_bancarios.titular,
                ci_ruc: r.dados_bancarios.ci_ruc,
            }
            : null,
        maletas: r.maletas.map((m) => ({
            id: m.id,
            numero: m.numero,
            status: m.status,
            data_envio: m.data_envio.toISOString(),
            data_limite: m.data_limite.toISOString(),
            valor_total_vendido: m.valor_total_vendido ? Number(m.valor_total_vendido) : null,
            valor_comissao_revendedora: m.valor_comissao_revendedora ? Number(m.valor_comissao_revendedora) : null,
        })),
        documentos: r.documentos.map((d) => ({
            id: d.id,
            tipo: d.tipo,
            url: d.url,
            status: d.status,
            observacao: d.observacao,
            created_at: d.created_at.toISOString(),
        })),
    };
}

// ============================================
// Perfil Detalhado — Consultora
// ============================================

export async function getPerfilConsultora(id: string): Promise<ConsultoraPerfil | null> {
    const user = await requireAuth(["ADMIN", "COLABORADORA"]);
    if (user.role === "COLABORADORA" && id !== user.profileId) {
        throw new Error("BUSINESS: No autorizado.");
    }
    const c = await prisma.reseller.findUnique({
        where: { id, role: "COLABORADORA" },
        include: {
            revendedoras_sob_mim: {
                include: {
                    maletas: {
                        where: { status: { in: ["concluida", "aguardando_revisao"] } },
                        select: { valor_total_vendido: true },
                    },
                },
            },
        },
    });
    if (!c) return null;

    const revendedoras = await Promise.all(
        c.revendedoras_sob_mim.map(async (rev) => {
            const pontosAgg = await prisma.pontosExtrato.aggregate({
                where: { reseller_id: rev.id },
                _sum: { pontos: true },
            });
            const faturamento = rev.maletas.reduce((s, m) => s + Number(m.valor_total_vendido || 0), 0);
            return {
                id: rev.id,
                name: rev.name,
                avatar_url: rev.avatar_url,
                is_active: rev.is_active,
                taxa_comissao: Number(rev.taxa_comissao),
                faturamento_total: faturamento,
                maletas_count: rev.maletas.length,
                pontos_total: pontosAgg._sum.pontos || 0,
            };
        })
    );

    const faturamento_grupo_total = revendedoras.reduce((s, r) => s + r.faturamento_total, 0);
    const comissao_grupo_total = faturamento_grupo_total * (Number(c.taxa_comissao) / 100);

    return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        whatsapp: c.whatsapp,
        email: c.email,
        avatar_url: c.avatar_url,
        taxa_comissao: Number(c.taxa_comissao),
        is_active: c.is_active,
        revendedoras,
        faturamento_grupo_total,
        comissao_grupo_total,
        revendedoras_ativas: revendedoras.filter((r) => r.is_active).length,
        revendedoras_inativas: revendedoras.filter((r) => !r.is_active).length,
    };
}

