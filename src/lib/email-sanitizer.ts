/**
 * Sanitização de HTML para emails transacionais Monarca.
 *
 * Allowlist canônica para Fase 13 (editor de templates admin).
 * Ref: docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md, CONTEXT.md D-01..D-05
 *
 * DISTINTO de escapeHtml (email-base.ts):
 * - escapeHtml: converte texto puro em texto seguro sem nenhuma tag
 * - sanitizeEmailHtml: HTML com tags permitidas, scripts/eventos removidos
 */
import sanitizeHtml from "sanitize-html";

/**
 * Tags HTML permitidas em corpos de email transacional.
 * D-01: suficientes para emails ricos sem expor vetores de ataque.
 */
export const EMAIL_ALLOWED_TAGS: string[] = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "span",
  "div",
];

/**
 * Atributos permitidos por tag.
 * D-02: style em TODAS as tags (email clients exigem CSS inline).
 * D-03: href apenas em <a>.
 * D-04: todos os demais atributos removidos (class, id, data-*, onclick, etc.).
 */
export const EMAIL_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["style"],
  a: ["href"],
};

/**
 * Sanitiza HTML para uso seguro em emails transacionais.
 *
 * Remove:
 * - Todas as tags não listadas em EMAIL_ALLOWED_TAGS
 * - Todos os atributos exceto style (todas tags) e href (<a>)
 * - href com protocolo não-http/https (bloqueia javascript:, data:, file:)
 * - Protocolos relativos (//evil.com)
 *
 * Preserva:
 * - Tags de formatação (p, strong, em, h1-h3, ul/ol/li, span, div)
 * - CSS inline via style (obrigatório para email clients)
 * - Links http/https via href em <a>
 *
 * @param html — HTML a sanitizar (pode conter input não-confiável)
 * @returns HTML sanitizado com apenas tags e atributos da allowlist
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: EMAIL_ALLOWED_ATTRS,
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
  });
}
