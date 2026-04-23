import { sendEmail } from "../emails";

export async function emailConviteUsuario(params: {
  email: string;
  nome: string;
  linkDefinirSenha: string;
  tipo: "consultora" | "revendedora";
}) {
  const { email, nome, linkDefinirSenha, tipo } = params;

  const titulo = tipo === "consultora"
    ? "💼 ¡Bienvenida al equipo! — Monarca Semijoyas"
    : "🦋 ¡Bienvenida a Monarca Semijoyas!";

  const subtitulo = tipo === "consultora"
    ? "Tu cuenta de consultora fue creada"
    : "Tu cuenta de revendedora fue creada";

  const ctaTexto = tipo === "consultora"
    ? "Definir mi contraseña →"
    : "Crear mi contraseña →";

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${tipo === "consultora" ? "/admin/login" : "/app/login"}`;

  await sendEmail({
    to: { email, name: nome },
    subject: titulo,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #35605a;">${subtitulo}</h2>
        <p>Hola <strong>${nome}</strong>,</p>
        <p>Tu cuenta en Monarca Semijoyas ya está lista. Hacé clic abajo para definir tu contraseña y empezar:</p>
        <a href="${linkDefinirSenha}"
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
