"use server";

import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/action-utils";
import { uploadAvatar } from "@/lib/upload";
import { requireAuth } from "@/lib/user";
import type { ColaboradoraItem, RevendedoraItem } from "@/lib/types";
export type { ColaboradoraItem, RevendedoraItem } from "@/lib/types";

// ============================================
// List Colaboradoras
// ============================================

export async function getColaboradoras(): Promise<ColaboradoraItem[]> {
    await requireAuth(["ADMIN"]);
    const data = await prisma.reseller.findMany({
        where: { role: "COLABORADORA" },
        orderBy: { name: "asc" },
        include: {
            _count: { select: { revendedoras_sob_mim: true } },
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
        revendedorasCount: r._count.revendedoras_sob_mim,
    }));
}

// ============================================
// List Revendedoras
// ============================================

export async function getRevendedoras(): Promise<RevendedoraItem[]> {
    await requireAuth(["ADMIN"]);
    const data = await prisma.reseller.findMany({
        where: { role: "REVENDEDORA" },
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

