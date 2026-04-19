// ============================================
// Product Validation Schemas
// ============================================

import { z } from "zod";

/** Schema for creating/updating a product via FormData */
export const productFormSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    sku: z.string().max(50).optional().default(""),
    short_description: z.string().max(500).optional().default(""),
    description: z.string().max(5000).optional().default(""),
    price: z.coerce.number().positive("Preço deve ser positivo").nullable().optional(),
    product_type: z.enum(["simple", "variable"]).default("simple"),
    categories: z.string().optional().default(""),
    stock_quantity: z.coerce.number().int().min(0).optional().default(0),
});

/** Schema for a product variant (inside the variants JSON string) */
export const variantSchema = z.object({
    attribute_name: z.string().min(1),
    attribute_value: z.string().min(1),
    price: z.coerce.number().positive().nullable(),
    sku: z.string().nullable().optional(),
    stock_quantity: z.coerce.number().int().min(0).optional().default(0),
});

export const variantsArraySchema = z.array(variantSchema);

/** Parse and validate FormData for product create/update */
export function parseProductForm(formData: FormData) {
    const raw = {
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        short_description: formData.get("short_description") as string,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        product_type: formData.get("product_type") as string,
        categories: formData.get("categories") as string,
        stock_quantity: formData.get("stock_quantity") as string,
    };

    return productFormSchema.parse(raw);
}
