"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma, MaletaStatus } from "@/generated/prisma/client";
import type { MaletaListItem, MaletaDetail } from "@/lib/types";
export type { MaletaListItem, MaletaDetail, MaletaItemDetail } from "@/lib/types";
import { mapMaletaToListItem, mapMaletaToDetail } from "@/lib/mappers/maleta.mapper";
import { sendPushNotification } from "@/lib/onesignal-server";
// Types imported from @/lib/types

// ============================================
// List Maletas
// ============================================

export async function getMaletas(
    resellerId?: string,
    status?: string
): Promise<MaletaListItem[]> {
    const where: Prisma.MaletaWhereInput = {};
    if (resellerId) where.reseller_id = resellerId;
    if (status) where.status = status as MaletaStatus;

    const maletas = await prisma.maleta.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
            reseller: { select: { id: true, name: true, avatar_url: true } },
            _count: { select: { itens: true } },
        },
    });

    return maletas.map(mapMaletaToListItem);
}

// ============================================
// Get Maleta Detail
// ============================================

export async function getMaletaById(id: string): Promise<MaletaDetail | null> {
    const maleta = await prisma.maleta.findUnique({
        where: { id },
        include: {
            reseller: {
                select: {
                    id: true,
                    name: true,
                    whatsapp: true,
                    avatar_url: true,
                    taxa_comissao: true,
                },
            },
            itens: {
                include: {
                    product_variant: {
                        include: {
                            product: {
                                select: { id: true, name: true, images: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!maleta) return null;

    return mapMaletaToDetail(maleta);
}

// ============================================
// Create Maleta (with stock reservation)
// ============================================

interface CriarMaletaItem {
    product_variant_id: string;
    quantidade: number;
}

export async function criarMaleta(
    resellerId: string,
    dataLimite: string,
    itens: CriarMaletaItem[]
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify stock and get prices for each variant
            const variantIds = itens.map((i) => i.product_variant_id);
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
            });

            const variantMap = new Map(variants.map((v) => [v.id, v]));

            for (const item of itens) {
                const variant = variantMap.get(item.product_variant_id);
                if (!variant) {
                    throw new Error(`Variante ${item.product_variant_id} não encontrada`);
                }
                if (variant.stock_quantity < item.quantidade) {
                    throw new Error(
                        `Stock insuficiente para "${variant.attribute_value}": disponível ${variant.stock_quantity}, solicitado ${item.quantidade}`
                    );
                }
            }

            // 2. Create the maleta
            const maleta = await tx.maleta.create({
                data: {
                    reseller_id: resellerId,
                    data_limite: new Date(dataLimite),
                    itens: {
                        create: itens.map((item) => {
                            const variant = variantMap.get(item.product_variant_id)!;
                            return {
                                product_variant_id: item.product_variant_id,
                                quantidade_enviada: item.quantidade,
                                preco_fixado: variant.price,
                            };
                        }),
                    },
                },
            });

            // 3. Reserve stock (decrement)
            for (const item of itens) {
                await tx.productVariant.update({
                    where: { id: item.product_variant_id },
                    data: { stock_quantity: { decrement: item.quantidade } },
                });
            }

            return maleta;
        });

        // 4. Disparar Notificação Push
        // Buscar o auth_user_id do reseller (OneSignal usa o Supabase Auth ID, não o Reseller ID)
        const reseller = await prisma.reseller.findUnique({
            where: { id: resellerId },
            select: { auth_user_id: true, name: true }
        });

        if (reseller?.auth_user_id) {
            sendPushNotification(
                [reseller.auth_user_id],
                "Nova Maleta Enviada! 💼",
                `${reseller.name}, foi enviada uma nova maleta para você. Clique para conferir as semijoias e prazos!`
            ).catch((err: unknown) => console.error("Falha no disparo não-bloqueante do push:", err));
        } else {
            console.warn("[Push] Reseller sem auth_user_id vinculado, push ignorado:", resellerId);
        }

        return { success: true, id: result.id };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Devolver Maleta (upload comprovativo)
// ============================================

export async function devolverMaleta(
    id: string,
    comprovanteUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.maleta.update({
            where: { id },
            data: {
                status: "aguardando_revisao",
                comprovante_devolucao_url: comprovanteUrl,
            },
        });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Fechar Maleta (registrar vendas)
// ============================================

interface ItemVendido {
    maleta_item_id: string;
    quantidade_vendida: number;
}

export async function fecharMaleta(
    id: string,
    itensVendidos: ItemVendido[]
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            // Update each item's quantidade_vendida
            for (const item of itensVendidos) {
                await tx.maletaItem.update({
                    where: { id: item.maleta_item_id },
                    data: { quantidade_vendida: item.quantidade_vendida },
                });
            }

            // Set status to aguardando_revisao
            await tx.maleta.update({
                where: { id },
                data: { status: "aguardando_revisao" },
            });
        });

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Conciliar Maleta (freeze values, return stock)
// ============================================

export async function conciliarMaleta(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            const maleta = await tx.maleta.findUnique({
                where: { id },
                include: {
                    itens: true,
                    reseller: { select: { taxa_comissao: true, colaboradora_id: true, colaboradora: { select: { taxa_comissao: true } } } },
                },
            });

            if (!maleta) throw new Error("Maleta não encontrada");

            // Calculate frozen values
            let totalVendido = 0;

            for (const item of maleta.itens) {
                const preco = item.preco_fixado ? Number(item.preco_fixado) : 0;
                totalVendido += preco * item.quantidade_vendida;

                // Return unsold stock
                const naoVendido = item.quantidade_enviada - item.quantidade_vendida;
                if (naoVendido > 0) {
                    await tx.productVariant.update({
                        where: { id: item.product_variant_id },
                        data: { stock_quantity: { increment: naoVendido } },
                    });
                }
            }

            // Calculate commissions
            const taxaRevendedora = Number(maleta.reseller.taxa_comissao) / 100;
            const comissaoRevendedora = totalVendido * taxaRevendedora;

            let comissaoColaboradora = 0;
            if (maleta.reseller.colaboradora) {
                const taxaColab = Number(maleta.reseller.colaboradora.taxa_comissao) / 100;
                comissaoColaboradora = totalVendido * taxaColab;
            }

            // Freeze values and mark as concluida
            await tx.maleta.update({
                where: { id },
                data: {
                    status: "concluida",
                    valor_total_vendido: totalVendido,
                    valor_comissao_revendedora: comissaoRevendedora,
                    valor_comissao_colaboradora: comissaoColaboradora,
                },
            });
        });

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        return { success: false, error: msg };
    }
}

// ============================================
// Get Active Resellers (for maleta creation)
// ============================================

export async function getActiveResellers() {
    const resellers = await prisma.reseller.findMany({
        where: { is_active: true, role: "REVENDEDORA" },
        select: { id: true, name: true, avatar_url: true, whatsapp: true, taxa_comissao: true },
        orderBy: { name: "asc" },
    });

    return resellers.map((r) => ({
        ...r,
        taxa_comissao: Number(r.taxa_comissao),
    }));
}

// ============================================
// Get Available Variants (for maleta creation)
// ============================================

export async function getAvailableVariants(search?: string) {
    // 1. Get products WITH variants that have stock > 0
    const variantWhere: Record<string, unknown> = { stock_quantity: { gt: 0 } };
    if (search) {
        variantWhere.product = { name: { contains: search, mode: "insensitive" } };
    }

    const variants = await prisma.productVariant.findMany({
        where: variantWhere,
        include: {
            product: { select: { id: true, name: true, images: true, price: true } },
        },
        orderBy: { product: { name: "asc" } },
        take: 50,
    });

    const result = variants.map((v) => ({
        id: v.id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        price: v.price ? Number(v.price) : (v.product.price ? Number(v.product.price) : null),
        stock_quantity: v.stock_quantity,
        sku: v.sku,
        product: {
            id: v.product.id,
            name: v.product.name,
            images: v.product.images as string[],
        },
    }));

    return result;
}

// ============================================
// Update Maleta Status (for overdue check)
// ============================================

export async function checkOverdueMaletas() {
    const now = new Date();
    await prisma.maleta.updateMany({
        where: {
            status: "ativa",
            data_limite: { lt: now },
        },
        data: { status: "atrasada" },
    });
}
