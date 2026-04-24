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
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY não configurada no ambiente.");
  }

  const recipients = Array.isArray(to) ? to : [to];
  await client.transactionalEmails.sendTransacEmail({
    sender: FROM,
    to: recipients,
    subject,
    htmlContent,
  });
}
