// ============================================
// Maleta Validation Schemas
// ============================================

import { z } from "zod";

/** Schema for a single maleta item (product variant + quantity) */
export const maletaItemSchema = z.object({
    product_variant_id: z.string().uuid("ID de variante inválido"),
    quantidade: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
});

/** Schema for creating a new maleta */
export const criarMaletaSchema = z.object({
    resellerId: z.string().uuid("ID da revendedora inválido"),
    dataLimite: z.string().min(1, "Data limite é obrigatória").refine(
        (val) => !isNaN(Date.parse(val)),
        "Data limite inválida"
    ),
    itens: z.array(maletaItemSchema).min(1, "Pelo menos 1 item é necessário"),
});

/** Schema for registering sold items */
export const itemVendidoSchema = z.object({
    maleta_item_id: z.string().uuid(),
    quantidade_vendida: z.coerce.number().int().min(0),
});

export const fecharMaletaSchema = z.object({
    id: z.string().uuid("ID da maleta inválido"),
    itensVendidos: z.array(itemVendidoSchema),
});
