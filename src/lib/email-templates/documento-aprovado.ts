import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, emailAlert, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";

/**
 * Envia email de documento aprovado para revendedora.
 *
 * Tom de voz: neutro (documentos/acertos).
 * Emoji máximo: 1 (apenas no título).
 */
export async function emailDocumentoAprovado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
): Promise<EmailContent> {
  const safeName = sanitizeTemplateVars(resellerName);
  const safeTipo = sanitizeTemplateVars(tipoDocumento);
  const docsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos`;

  const alert = emailAlert({
    text: "Tu documento fue revisado y aprobado.",
    variant: "success",
  });

  const cta = emailButton({
    text: "Ver mis documentos",
    url: docsUrl,
  });

  const bodyHtml = `
    <p>Tu <strong>${safeTipo}</strong> fue revisado y aprobado.</p>
    ${alert.html}
    ${cta.html}
  `;

  const bodyText = `
Tu ${tipoDocumento} fue revisado y aprobado.
${alert.text}
${cta.text}
  `.trim();

  const content = renderEmailBase({
    title: "✅ Tu documento fue aprobado — Monarca",
    previewText: `Tu ${tipoDocumento} fue aprobado`,
    greeting: `Hola ${safeName},`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: "✅ Tu documento fue aprobado — Monarca",
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
