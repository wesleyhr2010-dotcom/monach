import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";
import { getEmailContent } from "@/lib/email-logic";

/**
 * Envia notificação de documento pendente para administradores.
 *
 * Tom de voz: neutro (admin-facing).
 * Emoji máximo: 1 (apenas no título).
 * Nota: sem saudação (notificação direta para admin).
 *
 * Suporta overrides via banco de dados (Phase 13).
 */
export async function emailDocumentoPendente(
  resellerName: string,
  resellerId: string,
  tipoDocumento: string,
  destinatarios: { email: string; name?: string }[],
): Promise<EmailContent> {
  const safeName = sanitizeTemplateVars(resellerName);
  const safeTipo = sanitizeTemplateVars(tipoDocumento);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/revendedoras/${resellerId}/documentos`;

  const context = {
    nome_revendedora: safeName,
    tipo_documento: safeTipo,
    docs_url: link,
  };

  // Tenta obter override do banco de dados
  const override = await getEmailContent("documento_pendiente", context);

  if (override) {
    await sendEmail({
      to: destinatarios,
      subject: override.subject,
      htmlContent: override.html,
      textContent: override.text,
    });
    return { html: override.html, text: override.text };
  }

  // Fallback para template TypeScript
  const cta = emailButton({
    text: "Revisar en el panel admin",
    url: link,
  });

  const bodyHtml = `
    <p><strong>${safeName}</strong> envió un <strong>${safeTipo}</strong> para revisión.</p>
    ${cta.html}
  `;

  const bodyText = `
${resellerName} envió un ${tipoDocumento} para revisión.
${cta.text}
  `.trim();

  const content = renderEmailBase({
    title: `📄 Nuevo documento para revisar — ${resellerName}`,
    previewText: `${resellerName} envió un ${tipoDocumento}`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: destinatarios,
    subject: `📄 Nuevo documento para revisar — ${resellerName}`,
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
