import { sendEmail } from "../emails";

export async function emailDocumentoPendente(
  resellerName: string,
  resellerId: string,
  tipoDocumento: string,
  destinatarios: { email: string; name?: string }[],
) {
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/revendedoras/${resellerId}/documentos`;

  await sendEmail({
    to: destinatarios,
    subject: `📄 Nuevo documento para revisar — ${resellerName}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">📄 Documento pendiente de revisión</h2>
        <p><strong>${resellerName}</strong> envió un <strong>${tipoDocumento}</strong> para revisión.</p>
        <a href="${link}"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Revisar en el panel admin
        </a>
      </div>
    `,
  });
}
