import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, emailTable, emailDivider, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";

/**
 * Envia email de confirmação de acerto/consignação para revendedora.
 *
 * Tom de voz: neutro (documentos/acertos).
 * Emoji máximo: 1 (apenas no título).
 * Destaque: tabela visual de breakdown com highlight na linha de comissão.
 */
export async function emailAcertoConfirmado(
  resellerEmail: string,
  resellerName: string,
  maletaNumero: number,
  valorVendido: string,
  comissao: string,
  pctComissao: number,
): Promise<EmailContent> {
  const safeName = sanitizeTemplateVars(resellerName);
  const safeValor = sanitizeTemplateVars(valorVendido);
  const safeComissao = sanitizeTemplateVars(comissao);

  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monarcasemijoyas.com.py";
  baseUrl = baseUrl.includes("http") ? baseUrl : `https://${baseUrl}`;
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const portalUrl = `${baseUrl}/app/maleta`;

  const table = emailTable({
    headers: ["Concepto", "Monto"],
    rows: [
      ["Total vendido", safeValor],
      [`Tu comisión (${pctComissao}%)`, safeComissao],
    ],
    highlightRow: 1,
  });

  const divider = emailDivider();

  const cta = emailButton({
    text: "Ver mis consignaciones",
    url: portalUrl,
  });

  const bodyHtml = `
    <p>Tu consultora confirmó la recepción de la consignación <strong>#${maletaNumero}</strong>.</p>
    ${table.html}
    ${divider.html}
    ${cta.html}
  `;

  const bodyText = `
Tu consultora confirmó la recepción de la consignación #${maletaNumero}.
${table.text}
${divider.text}
${cta.text}
  `.trim();

  const content = renderEmailBase({
    title: `✅ Consignación #${maletaNumero} confirmada — Monarca`,
    previewText: `Consignación #${maletaNumero} confirmada`,
    greeting: `Hola ${safeName},`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: `✅ Consignación #${maletaNumero} confirmada — Monarca`,
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
