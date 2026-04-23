import { sendEmail } from "../emails";

export async function emailDocumentoRejeitado(
  resellerEmail: string,
  resellerName: string,
  tipoDocumento: string,
  motivo: string,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: "❌ Tu documento necesita corrección — Monarca",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #c0392b;">❌ Documento con observaciones</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu <strong>${tipoDocumento}</strong> necesita correcciones.</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/perfil/documentos"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Actualizar documento
        </a>
      </div>
    `,
  });
}
