/**
 * Lógica de resolução de overrides de templates de e-mail.
 *
 * Decide entre usar conteúdo do banco de dados (EmailTemplate) ou fallback TypeScript.
 * Implementa decisões D-13 a D-16 do CONTEXT.md.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { renderEmailBase } from "@/lib/email-base";
import { substituirVariaveis, htmlToPlainText } from "@/lib/notifications-shared";
import { sanitizeEmailHtml } from "@/lib/email-sanitizer";
import { EMAIL_VARIAVEIS_POR_TIPO, EMAIL_VARIAVEIS_GLOBAIS } from "@/lib/emails-shared";

export interface EmailOverride {
  id: string;
  tipo: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  preview: string | null;
  greeting: string | null;
  ativo: boolean;
}

/**
 * Busca override de template do banco de dados com cache por request (D-14).
 */
export const getEmailOverride = cache(async (tipo: string): Promise<EmailOverride | null> => {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { tipo, ativo: true },
    });

    if (!template) return null;

    return {
      id: template.id,
      tipo: template.tipo,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      preview: template.preview,
      greeting: template.greeting,
      ativo: template.ativo,
    };
  } catch (error) {
    // D-16: Em produção, log e propaga erro para abortar envio
    console.error(`[email-logic] Failed to fetch override for tipo="${tipo}":`, error);
    throw error;
  }
});

/**
 * Resolve conteúdo de e-mail (subject, html, text) com base em override ou fallback.
 *
 * @param tipo - Identificador do template (ex: 'acerto_confirmado')
 * @param context - Variáveis para interpolação
 * @returns Objeto com subject, html, text interpolados OU null se sem override
 */
export async function getEmailContent(
  tipo: string,
  context: Record<string, unknown>
): Promise<{ subject: string; html: string; text: string } | null> {
  // D-15: Em desenvolvimento, usa fallback TS por padrão a menos que flag esteja ativa
  if (process.env.NODE_ENV === "development" && !process.env.USE_EMAIL_DB_OVERRIDE) {
    return null;
  }

  const override = await getEmailOverride(tipo);
  if (!override) return null;

  // Obtém whitelist de variáveis para este tipo + globais
  const tipoWhitelist = EMAIL_VARIAVEIS_POR_TIPO[tipo] ?? [];
  const whitelist = [...new Set([...tipoWhitelist, ...EMAIL_VARIAVEIS_GLOBAIS])];

  // Interpola variáveis em todos os campos
  const subject = substituirVariaveis(override.subject, context, whitelist);
  const greeting = override.greeting
    ? substituirVariaveis(override.greeting, context, whitelist)
    : undefined;
  const preview = override.preview
    ? substituirVariaveis(override.preview, context, whitelist)
    : undefined;

  // Interpola variáveis no HTML antes de sanitizar
  const interpolatedHtml = substituirVariaveis(override.body_html, context, whitelist);

  // Sanitiza HTML do body
  const sanitizedHtml = sanitizeEmailHtml(interpolatedHtml);

  // D-11: Gera texto puro automaticamente se não fornecido
  const bodyText = override.body_text
    ? substituirVariaveis(override.body_text, context, whitelist)
    : htmlToPlainText(sanitizedHtml);

  // Renderiza com wrapper base (logo, footer, etc.)
  const rendered = renderEmailBase({
    title: subject,
    previewText: preview ?? undefined,
    greeting,
    bodyHtml: sanitizedHtml,
    bodyText,
  });

  return {
    subject,
    html: rendered.html,
    text: rendered.text,
  };
}
