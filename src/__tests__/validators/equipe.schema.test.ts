import { describe, it, expect } from "vitest";
import { membroEquipeSchema, registrarVendaSchema } from "@/lib/validators/equipe.schema";

describe("membroEquipeSchema", () => {
    it("should validate a valid team member", () => {
        const result = membroEquipeSchema.safeParse({
            name: "Maria Silva",
            whatsapp: "11999998888",
            email: "maria@email.com",
            taxa_comissao: "15",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.taxa_comissao).toBe(15);
            expect(result.data.email).toBe("maria@email.com");
        }
    });

    it("should accept empty email", () => {
        const result = membroEquipeSchema.safeParse({
            name: "Maria Silva",
            whatsapp: "11999998888",
            email: "",
            taxa_comissao: "10",
        });
        expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
        const result = membroEquipeSchema.safeParse({
            name: "Maria Silva",
            whatsapp: "11999998888",
            email: "not-an-email",
            taxa_comissao: "10",
        });
        expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
        const result = membroEquipeSchema.safeParse({
            name: "",
            whatsapp: "11999998888",
            taxa_comissao: "10",
        });
        expect(result.success).toBe(false);
    });

    it("should reject commission above 100%", () => {
        const result = membroEquipeSchema.safeParse({
            name: "Maria",
            whatsapp: "11999998888",
            taxa_comissao: "150",
        });
        expect(result.success).toBe(false);
    });

    it("should default is_active to true", () => {
        const result = membroEquipeSchema.safeParse({
            name: "Maria",
            whatsapp: "11999998888",
            taxa_comissao: "10",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.is_active).toBe(true);
        }
    });
});

describe("registrarVendaSchema", () => {
    it("should validate a valid sale", () => {
        const result = registrarVendaSchema.safeParse({
            cliente_nome: "João Pereira",
            cliente_telefone: "11888887777",
            itens: [
                { maleta_item_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789", quantidade: 1 },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("should reject empty cliente_nome", () => {
        const result = registrarVendaSchema.safeParse({
            cliente_nome: "",
            cliente_telefone: "11888887777",
            itens: [
                { maleta_item_id: "a0b1c2d3-e4f5-6789-abcd-ef0123456789", quantidade: 1 },
            ],
        });
        expect(result.success).toBe(false);
    });

    it("should reject empty itens", () => {
        const result = registrarVendaSchema.safeParse({
            cliente_nome: "João",
            cliente_telefone: "11888887777",
            itens: [],
        });
        expect(result.success).toBe(false);
    });
});
