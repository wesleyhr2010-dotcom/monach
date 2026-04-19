// ============================================
// Equipe Validation Schemas
// ============================================

import { z } from "zod";

/** Schema for creating/updating a team member (Colaboradora or Revendedora) */
export const membroEquipeSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    whatsapp: z.string().min(8, "WhatsApp inválido").max(20),
    email: z.string().email("E-mail inválido").or(z.literal("")).optional().default(""),
    taxa_comissao: z.coerce.number().min(0).max(100).default(0),
    colaboradora_id: z.string().uuid().nullable().optional(),
    is_active: z.coerce.boolean().optional().default(true),
});

/** Parse and validate FormData for team member create/update */
export function parseMembroForm(formData: FormData) {
    const raw = {
        name: formData.get("name") as string,
        whatsapp: formData.get("whatsapp") as string,
        email: (formData.get("email") as string) || "",
        taxa_comissao: formData.get("taxa_comissao") as string,
        colaboradora_id: (formData.get("colaboradora_id") as string) || null,
        is_active: formData.get("is_active") as string,
    };

    return membroEquipeSchema.parse(raw);
}

/** Schema for sale registration */
export const registrarVendaSchema = z.object({
    cliente_nome: z.string().min(1, "Nome do cliente é obrigatório").max(255),
    cliente_telefone: z.string().min(8, "Telefone inválido").max(20),
    itens: z.array(
        z.object({
            maleta_item_id: z.string().uuid(),
            quantidade: z.coerce.number().int().min(1),
        })
    ).min(1, "Pelo menos 1 item é necessário"),
});
