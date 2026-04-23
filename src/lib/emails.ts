import { BrevoClient } from "@getbrevo/brevo";

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
  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      htmlContent,
    });
  } catch (err) {
    // Email não deve bloquear a operação principal
    console.error("[Email Error]", subject, err);
  }
}
