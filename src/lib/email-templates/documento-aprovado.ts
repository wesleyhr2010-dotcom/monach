import { sendEmail } from "../emails";

export async function emailDocumentoAprovado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: "✅ Tu documento fue aprobado — Monarca",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">✅ ¡Documento aprobado!</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu <strong>${tipoDocumento}</strong> fue revisado y aprobado. 🎉</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Ver mis documentos
        </a>
      </div>
    `,
  });
}
