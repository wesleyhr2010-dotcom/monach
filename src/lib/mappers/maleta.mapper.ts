// ============================================
// Maleta Mappers — Single source of truth for Prisma → DTO
// ============================================

import type { Prisma } from "@/generated/prisma/client";
import type { MaletaListItem, MaletaDetail, MaletaItemDetail } from "@/lib/types";

/** Maleta with reseller + item count (for list views) */
type MaletaWithResellerAndCount = Prisma.MaletaGetPayload<{
    include: {
        reseller: { select: { id: true; name: true; avatar_url: true } };
        _count: { select: { itens: true } };
    };
}>;

/** Maleta with full detail relations */
type MaletaFull = Prisma.MaletaGetPayload<{
    include: {
        reseller: {
            select: {
                id: true;
                name: true;
                whatsapp: true;
                avatar_url: true;
                taxa_comissao: true;
                colaboradora: { select: { id: true; name: true; taxa_comissao: true } };
            };
        };
        itens: {
            include: {
                product_variant: {
                    include: {
                        product: { select: { id: true; name: true; images: true } };
                    };
                };
            };
        };
    };
}>;

/**
 * Map a Prisma Maleta (list query) to a MaletaListItem DTO.
 */
export function mapMaletaToListItem(m: MaletaWithResellerAndCount): MaletaListItem {
    return {
        id: m.id,
        numero: m.numero,
        status: m.status,
        data_envio: m.data_envio.toISOString(),
        data_limite: m.data_limite.toISOString(),
        created_at: m.created_at.toISOString(),
        reseller: m.reseller,
        _count: m._count,
        valor_total_vendido: m.valor_total_vendido ? Number(m.valor_total_vendido) : null,
    };
}

/**
 * Map a Prisma Maleta (full detail query) to a MaletaDetail DTO.
 * Gamification and category data must be injected by the caller.
 */
export function mapMaletaToDetail(
    maleta: MaletaFull,
    gamif?: { nivel: string | null; nivel_cor: string | null; pontos: number },
    categoryMap?: Map<string, string | null>
): MaletaDetail {
    return {
        id: maleta.id,
        numero: maleta.numero,
        status: maleta.status,
        data_envio: maleta.data_envio.toISOString(),
        data_limite: maleta.data_limite.toISOString(),
        comprovante_devolucao_url: maleta.comprovante_devolucao_url,
        valor_total_enviado: maleta.valor_total_enviado ? Number(maleta.valor_total_enviado) : null,
        valor_total_vendido: maleta.valor_total_vendido ? Number(maleta.valor_total_vendido) : null,
        valor_comissao_revendedora: maleta.valor_comissao_revendedora ? Number(maleta.valor_comissao_revendedora) : null,
        valor_comissao_colaboradora: maleta.valor_comissao_colaboradora ? Number(maleta.valor_comissao_colaboradora) : null,
        pct_comissao_aplicado: maleta.pct_comissao_aplicado ? Number(maleta.pct_comissao_aplicado) : null,
        nota_acerto: maleta.nota_acerto,
        created_at: maleta.created_at.toISOString(),
        updated_at: maleta.updated_at.toISOString(),
        reseller: {
            ...maleta.reseller,
            taxa_comissao: Number(maleta.reseller.taxa_comissao),
            colaboradora: maleta.reseller.colaboradora
                ? {
                    ...maleta.reseller.colaboradora,
                    taxa_comissao: Number(maleta.reseller.colaboradora.taxa_comissao),
                }
                : null,
            nivel: gamif?.nivel ?? null,
            nivel_cor: gamif?.nivel_cor ?? null,
            pontos: gamif?.pontos ?? 0,
        },
        itens: maleta.itens.map((item) => mapMaletaItemToDetail(item, categoryMap)),
    };
}

/**
 * Map a Prisma MaletaItem (with product variant) to a MaletaItemDetail DTO.
 */
function mapMaletaItemToDetail(
    item: MaletaFull["itens"][number],
    categoryMap?: Map<string, string | null>
): MaletaItemDetail {
    return {
        id: item.id,
        quantidade_enviada: item.quantidade_enviada,
        quantidade_vendida: item.quantidade_vendida,
        quantidade_recebida: item.quantidade_recebida,
        preco_fixado: item.preco_fixado ? Number(item.preco_fixado) : null,
        product_variant: {
            id: item.product_variant.id,
            attribute_name: item.product_variant.attribute_name,
            attribute_value: item.product_variant.attribute_value,
            price: item.product_variant.price ? Number(item.product_variant.price) : null,
            sku: item.product_variant.sku,
            stock_quantity: item.product_variant.stock_quantity,
            product: {
                id: item.product_variant.product.id,
                name: item.product_variant.product.name,
                images: item.product_variant.product.images as string[],
                category_name: categoryMap?.get(item.product_variant.product.id) ?? null,
            },
        },
    };
}
