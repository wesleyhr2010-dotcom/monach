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

/** Schema for registrar_venda
 *  NOTA: preco_unitario é determinado pelo servidor (preco_fixado do banco).
 *  O cliente não deve mais enviar este campo.
 */
export const registrarVendaSchema = z.object({
    maleta_item_id: z.string().uuid("ID do item inválido"),
    cliente_nome: z.string().min(2, "Nome é obrigatório").max(100),
    cliente_telefone: z.string().min(8, "Telefone inválido").max(20),
    preco_unitario: z.coerce.number().optional(), // legado: ignorado pelo servidor
});

export const registrarVendaMultiplaSchema = z.object({
  cliente_nome: z.string().min(2, "Nome é obrigatório").max(100),
  cliente_telefone: z.string().min(8, "Telefone inválido").max(20),
  itens: z.array(
    z.object({
      maleta_item_id: z.string().uuid(),
      quantidade: z.number().int().positive()
    })
  ).min(1, "Selecione ao menos 1 item"),
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

/** Schema for conferir (review + close) a maleta */
export const conferirItemSchema = z.object({
    item_id: z.string().uuid("ID do item inválido"),
    quantidade_recebida: z.number().int().min(0, "Quantidade recebida não pode ser negativa"),
});

export const conferirMaletaSchema = z.object({
    maleta_id: z.string().uuid("ID da maleta inválido"),
    itens_conferidos: z.array(conferirItemSchema).min(1, "Pelo menos 1 item é necessário"),
    nota_acerto: z.string().max(500).optional(),
    cierre_manual_sin_comprobante: z.boolean().optional(),
});

/** Schema for adding items to an existing maleta */
export const adicionarItensMaletaSchema = z.object({
    maleta_id: z.string().uuid("ID da maleta inválido"),
    itens: z.array(maletaItemSchema).min(1, "Pelo menos 1 item é necessário"),
});
