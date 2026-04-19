import { describe, it, expect } from "vitest";
import { productFormSchema, variantSchema, variantsArraySchema } from "@/lib/validators/product.schema";

describe("productFormSchema", () => {
    it("should validate a valid simple product", () => {
        const result = productFormSchema.safeParse({
            name: "Anel Dourado",
            sku: "AD001",
            short_description: "Anel banhado a ouro",
            description: "Anel banhado a ouro 18k com zircônia",
            price: "49.90",
            product_type: "simple",
            categories: "Anéis, Banhados",
            stock_quantity: "10",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Anel Dourado");
            expect(result.data.price).toBe(49.9);
            expect(result.data.stock_quantity).toBe(10);
        }
    });

    it("should reject a product without name", () => {
        const result = productFormSchema.safeParse({
            name: "",
            product_type: "simple",
        });
        expect(result.success).toBe(false);
    });

    it("should default product_type to simple", () => {
        const result = productFormSchema.safeParse({
            name: "Pulseira",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.product_type).toBe("simple");
        }
    });

    it("should reject invalid product_type", () => {
        const result = productFormSchema.safeParse({
            name: "Brinco",
            product_type: "invalid",
        });
        expect(result.success).toBe(false);
    });
});

describe("variantSchema", () => {
    it("should validate a valid variant", () => {
        const result = variantSchema.safeParse({
            attribute_name: "Tamanho",
            attribute_value: "P",
            price: 29.9,
            sku: "BRC-P",
            stock_quantity: 5,
        });
        expect(result.success).toBe(true);
    });

    it("should reject variant without attribute_name", () => {
        const result = variantSchema.safeParse({
            attribute_name: "",
            attribute_value: "M",
            price: 29.9,
        });
        expect(result.success).toBe(false);
    });
});

describe("variantsArraySchema", () => {
    it("should validate an array of variants", () => {
        const result = variantsArraySchema.safeParse([
            { attribute_name: "Tamanho", attribute_value: "P", price: 29.9 },
            { attribute_name: "Tamanho", attribute_value: "M", price: 34.9, stock_quantity: 3 },
        ]);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(2);
            expect(result.data[1].stock_quantity).toBe(3);
        }
    });

    it("should reject if any variant is invalid", () => {
        const result = variantsArraySchema.safeParse([
            { attribute_name: "Tamanho", attribute_value: "P", price: 29.9 },
            { attribute_name: "", attribute_value: "M", price: 34.9 },
        ]);
        expect(result.success).toBe(false);
    });
});
