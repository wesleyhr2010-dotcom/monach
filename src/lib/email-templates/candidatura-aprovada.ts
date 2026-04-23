import { sendEmail } from "../emails";

export async function emailCandidaturaAprovada(params: {
  email: string;
  nome: string;
  senhaTemp: string;
}) {
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/login`;

  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: "🦋 ¡Bienvenida a Monarca Semijoyas!",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #C9A84C;">🦋 ¡Tu solicitud fue aprobada!</h2>
        <p>Hola <strong>${params.nome}</strong>,</p>
        <p>¡Felicitaciones! Tu candidatura para ser Revendedora Monarca fue <strong>aprobada</strong>. 🎉</p>
        <p>Aquí están tus datos de acceso al portal:</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0; background: #f9f9f9; border-radius: 8px;">
          <tr>
            <td style="padding:12px; font-weight:bold;">🌐 Portal</td>
            <td style="padding:12px;"><a href="${loginUrl}">${loginUrl}</a></td>
          </tr>
          <tr>
            <td style="padding:12px; font-weight:bold;">📧 Correo</td>
            <td style="padding:12px;">${params.email}</td>
          </tr>
          <tr style="background:#fff8e7;">
            <td style="padding:12px; font-weight:bold;">🔑 Contraseña temporal</td>
            <td style="padding:12px; font-family: monospace; font-size: 16px; letter-spacing: 2px;">${params.senhaTemp}</td>
          </tr>
        </table>
        <p style="color:#888; font-size:13px;">Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.</p>
        <p>Tu consultora asignada se pondrá en contacto contigo pronto para explicarte cómo funciona tu primera consignación.</p>
        <a href="${loginUrl}"
           style="display:inline-block; background:#35605a; color:white;
                  padding:12px 28px; border-radius:6px; text-decoration:none; margin:16px 0;">
          Ingresar al portal →
        </a>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
        <p style="color:#aaa; font-size:12px;">Monarca Semijoyas · monarca.com.py</p>
      </div>
    `,
  });
}
