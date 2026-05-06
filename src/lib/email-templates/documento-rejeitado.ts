import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, emailAlert, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";

/**
 * Envia email de documento rejeitado para revendedora.
 *
 * Tom de voz: respeitoso (rejeição).
 * Emoji máximo: 1 (apenas no título).
 */
export async function emailDocumentoRejeitado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
  motivo: string,
): Promise<EmailContent> {
  const safeName = sanitizeTemplateVars(resellerName);
  const safeTipo = sanitizeTemplateVars(tipoDocumento);
  const safeMotivo = sanitizeTemplateVars(motivo);
  const docsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos`;

  const alert = emailAlert({
    text: safeMotivo,
    variant: "warning",
  });

  const cta = emailButton({
    text: "Actualizar documento",
    url: docsUrl,
  });

  const bodyHtml = `
    <p>Tu <strong>${safeTipo}</strong> necesita correcciones.</p>
    ${alert.html}
    ${cta.html}
  `;

  const bodyText = `
Tu ${tipoDocumento} necesita correcciones.
${alert.text}
${cta.text}
  `.trim();

  const content = renderEmailBase({
    title: "❌ Tu documento necesita corrección — Monarca",
    previewText: `Tu ${tipoDocumento} necesita correcciones`,
    greeting: `Hola ${safeName},`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: "❌ Tu documento necesita corrección — Monarca",
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
