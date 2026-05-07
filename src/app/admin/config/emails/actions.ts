"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { EMAIL_VARIAVEIS_POR_TIPO, EMAIL_VARIAVEIS_GLOBAIS, TIPO_EMAIL_OPTIONS } from "@/lib/emails-shared";
import type { EmailTemplate } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-utils";

const EmailTemplateSchema = z.object({
  tipo: z.string().min(1),
  subject: z.string().min(1).max(200),
  body_html: z.string().min(1),
  body_text: z.string().optional(),
  preview: z.string().max(200).optional(),
  greeting: z.string().max(100).optional(),
});

/**
 * Valida variáveis no conteúdo contra whitelist (D-05, D-08).
 */
function validateVariables(content: string | undefined, tipo: string): string[] {
  if (!content) return [];

  const matches = content.match(/\{([^}]+)\}/g) ?? [];
  const tipoWhitelist = EMAIL_VARIAVEIS_POR_TIPO[tipo] ?? [];
  const whitelist = [...new Set([...tipoWhitelist, ...EMAIL_VARIAVEIS_GLOBAIS])];

  const invalidVars: string[] = [];
  for (const match of matches) {
    const varName = match.slice(1, -1);
    if (!whitelist.includes(varName)) {
      invalidVars.push(varName);
    }
  }

  return invalidVars;
}

/**
 * Valida sintaxe de chaves (D-08): detecta chaves abertas sem fechar.
 */
function validateBraceSyntax(content: string | undefined): boolean {
  if (!content) return true;

  let balance = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") balance++;
    if (content[i] === "}") balance--;
    if (balance < 0) return false; // fechamento sem abertura
  }

  return balance === 0; // todas as chaves devem estar balanceadas
}

/**
 * Salva ou atualiza override de template de e-mail.
 * Usa upsert para criar no primeiro salvamento (D-01).
 */
export async function saveEmailTemplate(
  data: z.infer<typeof EmailTemplateSchema>
): Promise<ActionResult<EmailTemplate>> {
  try {
    await requireAuth(["ADMIN"]);

    // Validação do schema
    const parsed = EmailTemplateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Dados inválidos" };
    }

    const { tipo, subject, body_html, body_text, preview, greeting } = parsed.data;

    // Valida se tipo é válido
    const validTipo = TIPO_EMAIL_OPTIONS.find((t) => t.value === tipo);
    if (!validTipo) {
      return { success: false, error: "Tipo de e-mail inválido" };
    }

    // Validação de variáveis (D-05)
    const invalidSubject = validateVariables(subject, tipo);
    if (invalidSubject.length > 0) {
      return {
        success: false,
        error: `Variáveis não permitidas no assunto: ${invalidSubject.join(", ")}`,
      };
    }

    const invalidHtml = validateVariables(body_html, tipo);
    if (invalidHtml.length > 0) {
      return {
        success: false,
        error: `Variáveis não permitidas no HTML: ${invalidHtml.join(", ")}`,
      };
    }

    // Validação de sintaxe de chaves (D-08)
    if (!validateBraceSyntax(subject) || !validateBraceSyntax(body_html)) {
      return {
        success: false,
        error: "Sintaxe de variáveis inválida: verifique se todas as chaves estão fechadas",
      };
    }

    // Upsert: cria ou atualiza (D-01: sincronização lazy)
    const template = await prisma.emailTemplate.upsert({
      where: { tipo },
      create: {
        tipo,
        subject,
        body_html,
        body_text: body_text ?? null,
        preview: preview ?? null,
        greeting: greeting ?? null,
        ativo: true,
      },
      update: {
        subject,
        body_html,
        body_text: body_text ?? null,
        preview: preview ?? null,
        greeting: greeting ?? null,
        updated_at: new Date(),
      },
    });

    return { success: true, data: template };
  } catch (error) {
    console.error("[saveEmailTemplate] Error:", error);
    return { success: false, error: "Erro ao salvar template" };
  }
}

/**
 * Deleta override de template (D-02: reset via exclusão).
 */
export async function deleteEmailTemplate(tipo: string): Promise<ActionResult<void>> {
  try {
    await requireAuth(["ADMIN"]);

    await prisma.emailTemplate.delete({
      where: { tipo },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteEmailTemplate] Error:", error);
    return { success: false, error: "Erro ao deletar template" };
  }
}

/**
 * Toggle ativo/inativo do template (D-04).
 */
export async function toggleEmailTemplate(
  tipo: string,
  ativo: boolean
): Promise<ActionResult<void>> {
  try {
    await requireAuth(["ADMIN"]);

    await prisma.emailTemplate.update({
      where: { tipo },
      data: { ativo },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[toggleEmailTemplate] Error:", error);
    return { success: false, error: "Erro ao alterar status do template" };
  }
}

/**
 * Busca todos os templates com seus status.
 */
export async function getEmailTemplates(): Promise<
  Array<{
    tipo: string;
    label: string;
    hasOverride: boolean;
    ativo: boolean;
    updatedAt?: Date;
  }>
> {
  try {
    const overrides = await prisma.emailTemplate.findMany({
      select: { tipo: true, ativo: true, updated_at: true },
    });

    const overrideMap = new Map(
      overrides.map((o) => [o.tipo, { hasOverride: true, ativo: o.ativo, updatedAt: o.updated_at }])
    );

    return TIPO_EMAIL_OPTIONS.map((opt) => ({
      tipo: opt.value,
      label: opt.label,
      hasOverride: overrideMap.has(opt.value),
      ativo: overrideMap.get(opt.value)?.ativo ?? false,
      updatedAt: overrideMap.get(opt.value)?.updatedAt,
    }));
  } catch (error) {
    console.error("[getEmailTemplates] Error:", error);
    return TIPO_EMAIL_OPTIONS.map((opt) => ({
      tipo: opt.value,
      label: opt.label,
      hasOverride: false,
      ativo: false,
    }));
  }
}

/**
 * Busca um template específico por tipo.
 */
export async function getEmailTemplateByTipo(tipo: string): Promise<EmailTemplate | null> {
  try {
    return await prisma.emailTemplate.findUnique({
      where: { tipo },
    });
  } catch (error) {
    console.error("[getEmailTemplateByTipo] Error:", error);
    return null;
  }
}
