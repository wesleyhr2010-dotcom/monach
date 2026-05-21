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
// Public — Related Products (same category, excludes current product)
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

export async function getRelatedProductsByCategory(
    currentProductId: string,
    categories: string[],
    limit = 4
): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
        id: { not: currentProductId },
        ...(categories.length > 0 && {
            categories: {
                some: { category: { name: { in: categories } } },
            },
        }),
    };

    const products = await prisma.product.findMany({
        where,
        take: limit,
        orderBy: { created_at: "desc" },
        include: { categories: { include: { category: true } } },
    });

    // Fallback: if same-category returns fewer than limit, fill with recent products
    if (products.length < limit) {
        const existingIds = new Set(products.map((p) => p.id));
        existingIds.add(currentProductId);

        const fallback = await prisma.product.findMany({
            where: { id: { notIn: [...existingIds] } },
            take: limit - products.length,
            orderBy: { created_at: "desc" },
            include: { categories: { include: { category: true } } },
        });

        products.push(...fallback);
    }

    return products.map(mapProductToDTO);
}

// ============================================
// Public — Catalog Products (paginated + category filter)
// ============================================

export async function getCatalogProducts(
    page = 1,
    category = "all",
    pageSize = 24,
    search = ""
): Promise<ProductsResponse> {
    const offset = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};

    if (category && category !== "all") {
        where.categories = {
            some: { category: { name: category } },
        };
    }

    if (search.trim()) {
        where.name = { contains: search.trim(), mode: "insensitive" };
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
// Public — Representative image for a category (used as banner background)
// ============================================

export async function getCategoryBannerImage(categoryName: string): Promise<string> {
    const product = await prisma.product.findFirst({
        where: { categories: { some: { category: { name: categoryName } } } },
        orderBy: { created_at: "desc" },
        select: { images: true },
    });
    const images = product?.images as string[] | undefined;
    return images?.[0] ?? "/placeholder.svg";
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
// Public — Category hierarchy for menu navigation
// ============================================

export interface CategoryNode {
    name: string;
    children: string[];
}

// Subcategories that don't follow the "Parent (X)" naming pattern
const EXPLICIT_PARENTS: Record<string, string> = {
    "Pequeños":             "Aros",
    "Medianos":             "Aros",
    "Grandes":              "Aros",
    "Con dije":             "Collares",
    "Sin dije":             "Collares",
    "Alianzas":             "Accesorios",
    "Berloques":            "Accesorios",
    "Dijes":                "Accesorios",
    "Clutch":               "Accesorios",
};

export async function getCategoryHierarchy(): Promise<CategoryNode[]> {
    const all = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { name: true },
    });

    const names = all.map((c) => c.name);
    const nameSet = new Set(names);

    // Determine which names are children (either explicit or pattern "X (Y)")
    const childrenOf: Record<string, string[]> = {};
    const isChild = new Set<string>();

    for (const name of names) {
        // Explicit parent mapping
        if (EXPLICIT_PARENTS[name]) {
            const parent = EXPLICIT_PARENTS[name];
            if (nameSet.has(parent)) {
                childrenOf[parent] ??= [];
                childrenOf[parent].push(name);
                isChild.add(name);
                continue;
            }
        }

        // Carteras / Lentes — names with leading zero-width char or slash belong to Accesorios
        const cleaned = name.replace(/[​-‍﻿⁠]/g, "").trim();
        if (cleaned !== name || name.includes("Carteras") || name.includes("Lentes de sol")) {
            childrenOf["Accesorios"] ??= [];
            childrenOf["Accesorios"].push(name);
            isChild.add(name);
            continue;
        }

        // Pattern: "X (Y)" — parent is X if X exists
        const match = name.match(/^(.+)\s+\((.+)\)$/);
        if (match) {
            const parent = match[1].trim();
            if (nameSet.has(parent)) {
                childrenOf[parent] ??= [];
                childrenOf[parent].push(name);
                isChild.add(name);
            }
            // If parent doesn't exist (e.g., "Collar" vs "Collares"), try "Collares"
            else if (nameSet.has(parent + "s")) {
                const p = parent + "s";
                childrenOf[p] ??= [];
                childrenOf[p].push(name);
                isChild.add(name);
            }
        }
    }

    // Build result: main categories (not children) with their children
    const ORDER = [
        "Aros", "Pulseras", "Collares", "Collar", "Anillos",
        "Tobilleras", "Piercings", "Conjuntos", "Accesorios",
        "Fiesta", "Infantil", "Plateado", "Outlet", "Organizador para joyas",
    ];

    const result: CategoryNode[] = [];
    const added = new Set<string>();

    // Add in preferred order first
    for (const name of ORDER) {
        if (nameSet.has(name) && !isChild.has(name)) {
            result.push({ name, children: childrenOf[name] ?? [] });
            added.add(name);
        }
    }

    // Append any remaining main categories not in ORDER
    for (const name of names) {
        if (!isChild.has(name) && !added.has(name)) {
            result.push({ name, children: childrenOf[name] ?? [] });
        }
    }

    return result;
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
