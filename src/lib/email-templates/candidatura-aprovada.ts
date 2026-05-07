import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, emailTable, emailAlert, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";
import { getEmailContent } from "@/lib/email-logic";

/**
 * Envia email de aprovação de candidatura para revendedora.
 *
 * Tom de voz: entusiasmado (aprovação/cadastro).
 * Emoji máximo: 2 (já presente no título).
 *
 * Suporta overrides via banco de dados (Phase 13).
 */
export async function emailCandidaturaAprovada(params: {
  email: string;
  nome: string;
  senhaTemp: string;
}): Promise<EmailContent> {
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/login`;
  const safeNome = sanitizeTemplateVars(params.nome);
  const safeEmail = sanitizeTemplateVars(params.email);
  const safeSenha = sanitizeTemplateVars(params.senhaTemp);

  const context = {
    nome_revendedora: safeNome,
    portal_url: loginUrl,
    email: safeEmail,
    senha_temp: safeSenha,
  };

  // Tenta obter override do banco de dados
  const override = await getEmailContent("candidatura_aprobada", context);

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
  const table = emailTable({
    rows: [
      ["Portal", loginUrl],
      ["Correo", safeEmail],
      ["Contraseña temporal", safeSenha],
    ],
    highlightRow: 2,
  });

  const alert = emailAlert({
    text: "Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.",
    variant: "info",
  });

  const cta = emailButton({
    text: "Ingresar al portal →",
    url: loginUrl,
  });

  const bodyHtml = `
    <p>¡Felicitaciones! Tu candidatura para ser Revendedora Monarca fue <strong>aprobada</strong>.</p>
    <p>Aquí están tus datos de acceso al portal:</p>
    ${table.html}
    ${alert.html}
    <p>Tu consultora asignada se pondrá en contacto contigo pronto para explicarte cómo funciona tu primera consignación.</p>
    ${cta.html}
  `;

  const bodyText = `
¡Felicitaciones! Tu candidatura para ser Revendedora Monarca fue aprobada.
Aquí están tus datos de acceso al portal:
${table.text}
${alert.text}
Tu consultora asignada se pondrá en contacto contigo pronto para explicarte cómo funciona tu primera consignación.
${cta.text}
  `.trim();

  const content = renderEmailBase({
    title: "🦋 ¡Bienvenida a Monarca Semijoyas!",
    previewText: "Tu candidatura fue aprobada",
    greeting: `¡Hola ${safeNome}!`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: "🦋 ¡Bienvenida a Monarca Semijoyas!",
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
