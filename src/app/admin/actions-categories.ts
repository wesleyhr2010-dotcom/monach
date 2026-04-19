"use server";

import { prisma } from "@/lib/prisma";
import { safeAction, generateSlug } from "@/lib/action-utils";

// ============================================
// Types
// ============================================

export interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    sort_order: number;
    created_at: string;
}

// ============================================
// List Categories
// ============================================

export async function getCategories(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    });

    return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent_id: c.parent_id,
        sort_order: c.sort_order,
        created_at: c.created_at.toISOString(),
    }));
}

// ============================================
// Create Category
// ============================================

export async function createCategory(
    name: string,
    parent_id?: string | null
) {
    return safeAction(async () => {
        const slug = generateSlug(name);

        // Get max sort_order for sibling level
        const lastSibling = await prisma.category.findFirst({
            where: { parent_id: parent_id || null },
            orderBy: { sort_order: "desc" },
            select: { sort_order: true },
        });

        const sort_order = (lastSibling?.sort_order ?? -1) + 1;

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                parent_id: parent_id || null,
                sort_order,
            },
        });

        return category.id;
    });
}

// ============================================
// Update Category
// ============================================

export async function updateCategory(
    id: string,
    name: string,
    parent_id?: string | null
) {
    return safeAction(async () => {
        const slug = generateSlug(name);

        const data: Record<string, unknown> = { name, slug };
        if (parent_id !== undefined) {
            data.parent_id = parent_id || null;
        }

        await prisma.category.update({
            where: { id },
            data,
        });
    });
}

// ============================================
// Reorder Categories
// ============================================

export async function updateCategoriesOrder(
    items: { id: string; parent_id: string | null; sort_order: number }[]
) {
    return safeAction(async () => {
        await prisma.$transaction(
            items.map((item) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: {
                        parent_id: item.parent_id,
                        sort_order: item.sort_order,
                    },
                })
            )
        );
    });
}

// ============================================
// Delete Category
// ============================================

export async function deleteCategory(id: string) {
    return safeAction(async () => {
        await prisma.category.delete({ where: { id } });
    });
}
