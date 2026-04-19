"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { Product, ProductsResponse, Reseller } from "@/lib/types";
import { toNumber } from "@/lib/action-utils";
import { mapProductToDTO, mapProductWithVariantsToDTO } from "@/lib/mappers/product.mapper";

// ============================================
// Public — Product by Slug/ID
// ============================================

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
        where: { id: slug },
        include: {
            variants: { orderBy: { attribute_name: "asc" } },
            categories: { include: { category: true } },
        },
    });

    if (!product) return null;

    return mapProductWithVariantsToDTO(product);
}

// ============================================
// Public — Related Products
// ============================================

export async function getRelatedProducts(limit = 4): Promise<Product[]> {
    const products = await prisma.product.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
    });

    return products.map((p) => ({
        ...p,
        price: toNumber(p.price),
        images: p.images as string[],
        categories: [],
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
    })) as Product[];
}

// ============================================
// Public — Catalog Products (paginated + category filter)
// ============================================

export async function getCatalogProducts(
    page = 1,
    category = "all",
    pageSize = 24
): Promise<ProductsResponse> {
    const offset = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};
    if (category && category !== "all") {
        where.categories = {
            some: { category: { name: category } },
        };
    }

    const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip: offset,
            take: pageSize,
            orderBy: { created_at: "desc" },
            include: {
                categories: { include: { category: true } },
            },
        }),
    ]);

    const mapped = products.map(mapProductToDTO);

    return { products: mapped, total, page, pageSize };
}

// ============================================
// Public — All Categories (for filters)
// ============================================

export async function getAllCategories(): Promise<string[]> {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { name: true },
    });

    return categories.map((c) => c.name);
}

// ============================================
// Public — Reseller by Slug
// ============================================

export async function getResellerBySlug(slug: string): Promise<Reseller | null> {
    const reseller = await prisma.reseller.findFirst({
        where: { slug, is_active: true },
    });

    if (!reseller) return null;

    return {
        ...reseller,
        taxa_comissao: toNumber(reseller.taxa_comissao),
        created_at: reseller.created_at.toISOString(),
        updated_at: reseller.updated_at.toISOString(),
    } as Reseller;
}

// ============================================
// Public — Reseller Catalog Products
// ============================================

export async function getResellerCatalogProducts(resellerId: string): Promise<Product[]> {
    const rows = await prisma.resellerProduct.findMany({
        where: { reseller_id: resellerId },
        include: { product: true },
        orderBy: { is_featured: "desc" },
    });

    return rows
        .filter((row) => row.product)
        .map((row) => {
            const product = row.product;
            const mapped = {
                ...product,
                price: row.custom_price ? toNumber(row.custom_price) : toNumber(product.price),
                images: product.images as string[],
                categories: [],
                created_at: product.created_at.toISOString(),
                updated_at: product.updated_at.toISOString(),
            } as Product;
            return mapped;
        });
}
