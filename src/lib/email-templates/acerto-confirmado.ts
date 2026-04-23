import { sendEmail } from "../emails";

export async function emailAcertoConfirmado(
  resellerEmail: string,
  resellerName: string,
  maletaNumero: number,
  valorVendido: string,
  comissao: string,
  pctComissao: number,
) {
  await sendEmail({
    to: { email: resellerEmail, name: resellerName },
    subject: `✅ Consignación #${maletaNumero} confirmada — Monarca`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px;">
        <h2 style="color: #35605a;">✅ ¡Consignación cerrada!</h2>
        <p>Hola <strong>${resellerName}</strong>,</p>
        <p>Tu consultora confirmó la recepción de la consignación <strong>#${maletaNumero}</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr style="background:#f5f5f5;">
            <td style="padding:10px; border:1px solid #ddd;">Total vendido</td>
            <td style="padding:10px; border:1px solid #ddd;"><strong>${valorVendido}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #ddd;">Tu comisión (${pctComissao}%)</td>
            <td style="padding:10px; border:1px solid #ddd; color:#35605a;"><strong>${comissao}</strong></td>
          </tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/app/maleta"
           style="display: inline-block; background: #35605a; color: white;
                  padding: 10px 24px; border-radius: 6px; text-decoration: none;">
          Ver mis consignaciones
        </a>
      </div>
    `,
  });
}
