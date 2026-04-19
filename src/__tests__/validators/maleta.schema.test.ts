import { describe, it, expect } from "vitest";
import { criarMaletaSchema, fecharMaletaSchema, maletaItemSchema } from "@/lib/validators/maleta.schema";

describe("maletaItemSchema", () => {
    it("should validate a valid item", () => {
        const result = maletaItemSchema.safeParse({
            product_variant_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            quantidade: 3,
        });
        expect(result.success).toBe(true);
    });

    it("should reject quantity zero", () => {
        const result = maletaItemSchema.safeParse({
            product_variant_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            quantidade: 0,
        });
        expect(result.success).toBe(false);
    });

    it("should reject invalid UUID", () => {
        const result = maletaItemSchema.safeParse({
            product_variant_id: "not-a-uuid",
            quantidade: 1,
        });
        expect(result.success).toBe(false);
    });
});

describe("criarMaletaSchema", () => {
    it("should validate a valid maleta creation", () => {
        const result = criarMaletaSchema.safeParse({
            resellerId: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            dataLimite: "2026-04-15T00:00:00.000Z",
            itens: [
                { product_variant_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789", quantidade: 2 },
                { product_variant_id: "b1c2d3e4-f5a6-7890-bcde-f01234567890", quantidade: 1 },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("should reject empty itens array", () => {
        const result = criarMaletaSchema.safeParse({
            resellerId: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            dataLimite: "2026-04-15",
            itens: [],
        });
        expect(result.success).toBe(false);
    });

    it("should reject missing dataLimite", () => {
        const result = criarMaletaSchema.safeParse({
            resellerId: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            dataLimite: "",
            itens: [{ product_variant_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789", quantidade: 1 }],
        });
        expect(result.success).toBe(false);
    });

    it("should reject invalid date", () => {
        const result = criarMaletaSchema.safeParse({
            resellerId: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            dataLimite: "not-a-date",
            itens: [{ product_variant_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789", quantidade: 1 }],
        });
        expect(result.success).toBe(false);
    });
});

describe("fecharMaletaSchema", () => {
    it("should validate valid closure data", () => {
        const result = fecharMaletaSchema.safeParse({
            id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
            itensVendidos: [
                { maleta_item_id: "b1c2d3e4-f5a6-7890-bcde-f01234567890", quantidade_vendida: 2 },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("should reject invalid maleta ID", () => {
        const result = fecharMaletaSchema.safeParse({
            id: "invalid",
            itensVendidos: [],
        });
        expect(result.success).toBe(false);
    });
});
