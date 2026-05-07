import { sendEmail } from "../emails";
import { renderEmailBase, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";
import { getEmailContent } from "@/lib/email-logic";

/**
 * Envia email de rechazo de candidatura para revendedora.
 *
 * Tom de voz: respeitoso, sem exclamação.
 * Emoji: 0 (proibido para rejeição).
 *
 * Suporta overrides via banco de dados (Phase 13).
 */
export async function emailCandidaturaRechazada(params: {
  email: string;
  nome: string;
}): Promise<EmailContent> {
  const safeNome = sanitizeTemplateVars(params.nome);

  const context = {
    nome_revendedora: safeNome,
    whatsapp_soporte: process.env.WHATSAPP_SUPORTE ?? "",
  };

  // Tenta obter override do banco de dados
  const override = await getEmailContent("candidatura_rechazada", context);

  if (override) {
    await sendEmail({
      to: { email: params.email, name: params.nome },
      subject: override.subject,
      htmlContent: override.html,
      textContent: override.text,
    });
    return { html: override.html, text: override.text };
  }

  // Fallback para template TypeScript
  const bodyHtml = `
    <p>Gracias por tu interés en unirte a nuestra red de revendedoras.</p>
    <p>Lamentablemente, en esta oportunidad no podemos continuar con tu candidatura.</p>
    <p>Si tenés preguntas o deseás más información, podés contactarnos directamente a través de nuestras redes sociales o por WhatsApp.</p>
    <p>Te agradecemos tu comprensión.</p>
  `;

  const bodyText = `
Gracias por tu interés en unirte a nuestra red de revendedoras.
Lamentablemente, en esta oportunidad no podemos continuar con tu candidatura.
Si tenés preguntas o deseás más información, podés contactarnos directamente a través de nuestras redes sociales o por WhatsApp.
Te agradecemos tu comprensión.
  `.trim();

  const content = renderEmailBase({
    title: "Sobre tu solicitud en Monarca Semijoyas",
    previewText: "Información sobre tu candidatura",
    greeting: `Hola ${safeNome},`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: "Sobre tu solicitud en Monarca Semijoyas",
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
