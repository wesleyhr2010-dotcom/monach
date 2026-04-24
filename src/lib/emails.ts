import { BrevoClient } from "@getbrevo/brevo";
import { safeLogError } from "@/lib/errors/sanitize-log";

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? "" });

const FROM = {
  email: process.env.BREVO_FROM_EMAIL ?? "no-reply@monarcasemijoyas.com.py",
  name: process.env.BREVO_FROM_NAME ?? "Monarca Semijoyas",
};

export async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: { email: string; name?: string } | { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY não configurada no ambiente.");
  }

  const recipients = Array.isArray(to) ? to : [to];
  const traceId = crypto.randomUUID().slice(0, 8);

  console.info("[Email][Brevo][Start]", {
    traceId,
    subject,
    toCount: recipients.length,
    fromConfigured: Boolean(FROM.email),
    hasApiKey: Boolean(process.env.BREVO_API_KEY),
  });

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: recipients,
      subject,
      htmlContent,
    });

    console.info("[Email][Brevo][Success]", {
      traceId,
      messageId: response?.messageId ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    safeLogError("[Email][Brevo][Error]", {
      traceId,
      subject,
      toCount: recipients.length,
      errorMessage: message,
      error: err as Record<string, unknown>,
    });
    throw new Error(`Brevo send failed [${traceId}]: ${message}`);
  }
}
