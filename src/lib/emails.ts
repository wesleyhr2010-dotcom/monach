import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? "" });

const FROM = {
  email: process.env.BREVO_FROM_EMAIL ?? "no-reply@monarcasemijoyas.com.py",
  name: process.env.BREVO_FROM_NAME ?? "Monarca Semijoyas",
};

interface SendEmailBase {
  to: { email: string; name?: string } | { email: string; name?: string }[];
  subject: string;
}

interface SendEmailLegacy extends SendEmailBase {
  htmlContent: string;
}

interface SendEmailBranded extends SendEmailBase {
  htmlContent: string;
  textContent: string;
}

/**
 * Envia email transacional via Brevo.
 *
 * Aceita duas assinaturas para compatibilidade:
 * 1. `{ to, subject, htmlContent }` — legado (Phase 1-6)
 * 2. `{ to, subject, htmlContent, textContent }` — branding Phase 7+
 *
 * **Recomendação:** Para emails branding Phase 7, preferir passar
 * `textContent` para fallback plaintext em clientes que não renderizam HTML.
 *
 * @param params.to — Destinatário(s)
 * @param params.subject — Assunto
 * @param params.htmlContent — Corpo HTML
 * @param params.textContent — Corpo texto puro (opcional, preferencial para branding)
 */
export async function sendEmail(
  params: SendEmailLegacy | SendEmailBranded
): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY não configurada no ambiente.");
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  const payload: {
    sender: typeof FROM;
    to: typeof recipients;
    subject: string;
    htmlContent: string;
    textContent?: string;
  } = {
    sender: FROM,
    to: recipients,
    subject: params.subject,
    htmlContent: params.htmlContent,
  };

  if ("textContent" in params && params.textContent) {
    payload.textContent = params.textContent;
  }

  await client.transactionalEmails.sendTransacEmail(payload);
}
