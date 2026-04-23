import * as Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!,
);

const FROM = {
  email: process.env.BREVO_FROM_EMAIL ?? "no-reply@monarca.com.py",
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
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = Array.isArray(to) ? to : [to];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (err) {
    // Email não deve bloquear a operação principal
    console.error("[Email Error]", subject, err);
  }
}
