import { sendEmail } from "../emails";

export async function emailConviteUsuario(params: {
  email: string;
  nome: string;
  linkDefinirSenha: string | null;
  senhaTemporaria: string;
  tipo: "consultora" | "revendedora";
}) {
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

  await sendEmail({
    to: { email, name: nome },
    subject: titulo,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #35605a;">${subtitulo}</h2>
        <p>Hola <strong>${nome}</strong>,</p>
        <p>Tu cuenta en Monarca Semijoyas ya está lista.</p>
        <p>Usá esta contraseña temporal para tu primer acceso:</p>
        <div style="background:#f7f8f8; border:1px solid #dfe5e4; border-radius:8px; padding:12px 16px; margin:12px 0 18px;">
          <span style="font-family: monospace; font-size: 16px; letter-spacing: 1px;">${senhaTemporaria}</span>
        </div>
        <p>Después, hacé clic abajo para redefinir tu contraseña de forma segura:</p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 12px 28px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          ${ctaTexto}
        </a>
        <p style="color: #888; font-size: 13px;">El enlace expira en 24 horas. Si no solicitaste esto, ignorá este correo.</p>
        <p style="color: #666; font-size: 13px;">Una vez que definas tu contraseña, podés ingresar en:<br/>
          <a href="${portalUrl}" style="color: #35605a;">${portalUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">Monarca Semijoyas · monarcasemijoyas.com.py</p>
      </div>
    `,
  });
}
