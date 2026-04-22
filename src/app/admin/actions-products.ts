"use server";

import crypto from "crypto";
import type { Product, ProductsResponse } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { safeAction, toNumber } from "@/lib/action-utils";
import { uploadProductImage, deleteR2Image } from "@/lib/upload";
import { mapProductToDTO, mapProductWithVariantsToDTO } from "@/lib/mappers/product.mapper";
import { requireAuth } from "@/lib/user";

// ============================================
// Products — List
// ============================================

export async function getProducts(
    page = 1,
    search = "",
    pageSize = 20,
    category = ""
): Promise<ProductsResponse> {
    await requireAuth(["ADMIN"]);
    const offset = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};
    if (search) {
        where.name = { contains: search, mode: "insensitive" };
    }
    if (category) {
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

    const mappedProducts = products.map(mapProductToDTO);

    return { products: mappedProducts, total, page, pageSize };
}

// ============================================
// Products — Get by ID
// ============================================

export async function getProductById(id: string): Promise<Product | null> {
    await requireAuth(["ADMIN"]);
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            variants: { orderBy: { attribute_name: "asc" } },
            categories: { include: { category: true } },
        },
    });

    if (!product) return null;

    return mapProductWithVariantsToDTO(product);
}

// ============================================
// Products — Dashboard Stats
// ============================================

export async function getDashboardStats() {
    await requireAuth(["ADMIN"]);
    const [totalProducts, simpleCount, variableCount, allCategories] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { product_type: "simple" } }),
        prisma.product.count({ where: { product_type: "variable" } }),
        prisma.category.findMany({
            select: { name: true, _count: { select: { products: true } } },
        }),
    ]);

    const categoryCounts: Record<string, number> = {};
    for (const cat of allCategories) {
        if (cat.name) {
            const topLevel = cat.name.split(">")[0].trim();
            categoryCounts[topLevel] = (categoryCounts[topLevel] || 0) + cat._count.products;
        }
    }

    return { totalProducts, simpleCount, variableCount, categoryCounts };
}

// ============================================
// Products — Create
// ============================================

export async function createProduct(formData: FormData) {
    return safeAction(async () => {
        await requireAuth(["ADMIN"]);
        const { name, sku, shortDescription, description, price, productType, categoriesNames, variantData } =
            parseProductFormData(formData);

        // Upload new images
        const imageUrls = await uploadNewImages(formData, sku);

        // Find category IDs
        const foundCategories = await prisma.category.findMany({
            where: { name: { in: categoriesNames } },
            select: { id: true },
        });

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                short_description: shortDescription,
                description,
                price: productType === "variable" ? null : price,
                images: imageUrls,
                product_type: productType,
                categories: {
                    create: foundCategories.map((c) => ({ category_id: c.id })),
                },
                variants: {
                    create: variantData,
                },
            },
        });

        return product.id;
    });
}

// ============================================
// Products — Update
// ============================================

export async function updateProduct(id: string, formData: FormData) {
    return safeAction(async () => {
        await requireAuth(["ADMIN"]);
        const { name, sku, shortDescription, description, price, productType, categoriesNames, variantData } =
            parseProductFormData(formData);

        // Upload new images (preserving existing)
        const imageUrls = await uploadNewImages(formData, sku);

        // Find category IDs
        const foundCategories = await prisma.category.findMany({
            where: { name: { in: categoriesNames } },
            select: { id: true },
        });

        // Get existing variants to decide update vs create vs delete
        const existingVariants = await prisma.productVariant.findMany({
            where: { product_id: id },
            include: { _count: { select: { maleta_itens: true } } },
        });

        // Build a map of existing variants by (attribute_name, attribute_value)
        const existingMap = new Map(
            existingVariants.map((v) => [`${v.attribute_name}::${v.attribute_value}`, v])
        );

        // Determine which variants to upsert and which existing ones to remove
        const variantOps: Prisma.PrismaPromise<unknown>[] = [];
        const matchedIds = new Set<string>();

        for (const v of variantData) {
            const key = `${v.attribute_name}::${v.attribute_value}`;
            const existing = existingMap.get(key);

            if (existing) {
                // Update existing variant in-place (preserves FK references)
                matchedIds.add(existing.id);
                variantOps.push(
                    prisma.productVariant.update({
                        where: { id: existing.id },
                        data: {
                            price: v.price,
                            sku: v.sku || null,
                            stock_quantity: v.stock_quantity ?? 0,
                        },
                    })
                );
            } else {
                // New variant — create it
                variantOps.push(
                    prisma.productVariant.create({
                        data: {
                            product_id: id,
                            attribute_name: v.attribute_name,
                            attribute_value: v.attribute_value,
                            price: v.price,
                            sku: v.sku || null,
                            stock_quantity: v.stock_quantity ?? 0,
                        },
                    })
                );
            }
        }

        // Only delete variants that are NOT referenced by maleta_itens
        const toDelete = existingVariants.filter(
            (v) => !matchedIds.has(v.id) && v._count.maleta_itens === 0
        );

        await prisma.$transaction([
            // Replace categories (no FK issue)
            prisma.productCategory.deleteMany({ where: { product_id: id } }),
            // Update product fields
            prisma.product.update({
                where: { id },
                data: {
                    name,
                    sku,
                    short_description: shortDescription,
                    description,
                    price: productType === "variable" ? null : price,
                    images: imageUrls,
                    product_type: productType,
                    categories: {
                        create: foundCategories.map((c) => ({ category_id: c.id })),
                    },
                },
            }),
            // Upsert variants
            ...variantOps,
            // Delete orphaned variants (only those without maleta references)
            ...toDelete.map((v) => prisma.productVariant.delete({ where: { id: v.id } })),
        ]);
    });
}

// ============================================
// Products — Delete
// ============================================

export async function deleteProduct(id: string) {
    return safeAction(async () => {
        await requireAuth(["ADMIN"]);
        // Get images to clean up from R2
        const product = await prisma.product.findUnique({
            where: { id },
            select: { images: true },
        });

        // Delete images from R2 (best-effort)
        if (product?.images?.length) {
            const urls = product.images as string[];
            await Promise.allSettled(urls.map((url) => deleteR2Image(url)));
        }

        // Cascade delete product (variants, categories, etc.)
        await prisma.product.delete({ where: { id } });
    });
}

// ============================================
// Internal Helpers
// ============================================

/** Parse product FormData — shared between create and update */
function parseProductFormData(formData: FormData) {
    const name = formData.get("name") as string;
    const sku = (formData.get("sku") as string) || crypto.randomBytes(4).toString("hex").toUpperCase();
    const shortDescription = (formData.get("short_description") as string) || "";
    const description = (formData.get("description") as string) || "";
    const priceStr = formData.get("price") as string;
    const price = priceStr ? parseFloat(priceStr) : null;
    const productType = (formData.get("product_type") as string) || "simple";
    const categoriesStr = (formData.get("categories") as string) || "";
    const categoriesNames = categoriesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

    let variantData: Array<{
        attribute_name: string;
        attribute_value: string;
        price: number | null;
        sku?: string | null;
        stock_quantity: number;
    }> = [];
    if (productType === "variable") {
        const variantsJson = formData.get("variants") as string;
        if (variantsJson) {
            const variants = JSON.parse(variantsJson) as Array<{
                attribute_name: string;
                attribute_value: string;
                price: number | null;
                sku: string | null;
                stock_quantity?: number;
            }>;
            variantData = variants
                .filter((v) => v.attribute_name && v.attribute_value)
                .map((v) => ({
                    attribute_name: v.attribute_name,
                    attribute_value: v.attribute_value,
                    price: v.price,
                    sku: v.sku || null,
                    stock_quantity: v.stock_quantity ?? 0,
                }));
        }
    } else {
        const stockStr = formData.get("stock_quantity") as string;
        const stockQty = stockStr ? parseInt(stockStr) : 0;
        variantData = [
            {
                attribute_name: "Tipo",
                attribute_value: "Único",
                price,
                stock_quantity: stockQty,
            },
        ];
    }

    return { name, sku, shortDescription, description, price, productType, categoriesNames, variantData };
}

/** Upload images from FormData, prepending existing images */
async function uploadNewImages(formData: FormData, sku: string): Promise<string[]> {
    const imageFiles = formData.getAll("images") as File[];
    const existingImages = JSON.parse((formData.get("existing_images") as string) || "[]");
    const urls: string[] = [...existingImages];

    for (const file of imageFiles) {
        if (file.size === 0) continue;
        const url = await uploadProductImage(file, sku, urls.length + 1);
        if (url) urls.push(url);
    }

    return urls;
}
