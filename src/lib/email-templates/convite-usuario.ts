import { sendEmail } from "../emails";
import { renderEmailBase, emailButton, emailAlert, type EmailContent } from "../email-base";
import { sanitizeTemplateVars } from "@/lib/notifications-server";
import { getEmailContent } from "@/lib/email-logic";

/**
 * Envia email de convite/criação de conta para consultora ou revendedora.
 *
 * Tom de voz: entusiasmado (aprovação/cadastro).
 * Emoji máximo: 2 (já presente no título).
 *
 * Suporta overrides via banco de dados (Phase 13).
 */
export async function emailConviteUsuario(params: {
  email: string;
  nome: string;
  linkDefinirSenha: string | null;
  senhaTemporaria: string;
  tipo: "consultora" | "revendedora";
}): Promise<EmailContent> {
  const { email, nome, linkDefinirSenha, senhaTemporaria, tipo } = params;

  const titulo = tipo === "consultora"
    ? "💼 ¡Bienvenida al equipo! — Monarca Semijoyas"
    : "🦋 ¡Bienvenida a Monarca Semijoyas!";

  const subtitulo = tipo === "consultora"
    ? "Tu cuenta de consultora fue creada"
    : "Tu cuenta de revendedora fue creada";

  const ctaTexto = tipo === "consultora"
    ? "Definir mi contraseña →"
    : "Crear mi contraseña →";

  let baseUrl =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";
  baseUrl = baseUrl.includes("http") ? baseUrl : `https://${baseUrl}`;
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const portalUrl = `${baseUrl}${tipo === "consultora" ? "/admin/login" : "/app/login"}`;
  const resetUrl = linkDefinirSenha ?? `${baseUrl}/auth/callback`;

  const safeNome = sanitizeTemplateVars(nome);
  const safeSenha = sanitizeTemplateVars(senhaTemporaria);
  const safeSubtitulo = sanitizeTemplateVars(subtitulo);

  const context = {
    nome_convidado: safeNome,
    nome_convidante: "", // TODO: passar quando disponível
    url_registro: resetUrl,
    whatsapp_soporte: process.env.WHATSAPP_SUPORTE ?? "",
  };

  // Tenta obter override do banco de dados
  const override = await getEmailContent("convite_usuario", context);

  if (override) {
    await sendEmail({
      to: { email, name: nome },
      subject: override.subject,
      htmlContent: override.html,
      textContent: override.text,
    });
    return { html: override.html, text: override.text };
  }

  // Fallback para template TypeScript
  const alert = emailAlert({
    text: `Contraseña temporal: ${safeSenha}`,
    variant: "warning",
  });

  const cta = emailButton({
    text: ctaTexto,
    url: resetUrl,
  });

  const bodyHtml = `
    <p>${safeSubtitulo}.</p>
    <p>Tu cuenta en Monarca Semijoyas ya está lista.</p>
    <p>Usá esta contraseña temporal para tu primer acceso:</p>
    ${alert.html}
    <p>Después, hacé clic abajo para redefinir tu contraseña de forma segura:</p>
    ${cta.html}
    <p style="color:#888; font-size:13px;">El enlace expira en 24 horas. Si no solicitaste esto, ignorá este correo.</p>
    <p style="color:#666; font-size:13px;">Una vez que definas tu contraseña, podés ingresar en:<br/>
      <a href="${portalUrl}" style="color:#35605a;">${portalUrl}</a>
    </p>
  `;

  const bodyText = `
${subtitulo}.
Tu cuenta en Monarca Semijoyas ya está lista.
Usá esta contraseña temporal para tu primer acceso:
${alert.text}
Después, hacé clic abajo para redefinir tu contraseña de forma segura:
${cta.text}
El enlace expira en 24 horas. Si no solicitaste esto, ignorá este correo.
Una vez que definas tu contraseña, podés ingresar en: ${portalUrl}
  `.trim();

  const content = renderEmailBase({
    title: titulo,
    previewText: subtitulo,
    greeting: `¡Hola ${safeNome}!`,
    bodyHtml,
    bodyText,
  });

  await sendEmail({
    to: { email, name: nome },
    subject: titulo,
    htmlContent: content.html,
    textContent: content.text,
  });

  return content;
}
