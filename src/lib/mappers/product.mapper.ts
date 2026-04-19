// ============================================
// Product Mappers — Single source of truth for Prisma → DTO
// ============================================

import type { Prisma } from "@/generated/prisma/client";
import type { Product, ProductVariant } from "@/lib/types";
import { toNumber } from "@/lib/action-utils";

/** Prisma Product with categories relation */
type ProductWithCategories = Prisma.ProductGetPayload<{
    include: { categories: { include: { category: true } } };
}>;

/** Prisma Product with categories + variants */
type ProductWithCategoriesAndVariants = Prisma.ProductGetPayload<{
    include: {
        categories: { include: { category: true } };
        variants: true;
    };
}>;

/**
 * Map a Prisma product (with categories) to a Product DTO.
 * Used by: getCatalogProducts, getProducts, admin product list.
 */
export function mapProductToDTO(p: ProductWithCategories): Product {
    const { categories, ...rest } = p;
    return {
        ...rest,
        price: toNumber(rest.price),
        product_type: rest.product_type as Product["product_type"],
        categories: categories.map((pc) => pc.category.name),
        images: rest.images as string[],
        created_at: rest.created_at.toISOString(),
        updated_at: rest.updated_at.toISOString(),
    };
}

/**
 * Map a Prisma product (with categories + variants) to a full Product DTO.
 * Used by: getProductById, getProductBySlug.
 */
export function mapProductWithVariantsToDTO(p: ProductWithCategoriesAndVariants): Product {
    const { categories, variants, ...rest } = p;
    return {
        ...rest,
        price: toNumber(rest.price),
        product_type: rest.product_type as Product["product_type"],
        images: rest.images as string[],
        categories: categories.map((pc) => pc.category.name),
        product_variants: variants.map(mapVariantToDTO),
        created_at: rest.created_at.toISOString(),
        updated_at: rest.updated_at.toISOString(),
    };
}

/**
 * Map a single ProductVariant from Prisma to DTO.
 */
export function mapVariantToDTO(v: Prisma.ProductVariantGetPayload<object>): ProductVariant {
    return {
        id: v.id,
        product_id: v.product_id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        price: toNumber(v.price),
        sku: v.sku,
        in_stock: v.in_stock,
        stock_quantity: v.stock_quantity ?? 0,
        created_at: v.created_at.toISOString(),
    };
}
