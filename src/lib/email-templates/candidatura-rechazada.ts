import { sendEmail } from "../emails";

export async function emailCandidaturaRechazada(params: {
  email: string;
  nome: string;
}) {
  await sendEmail({
    to: { email: params.email, name: params.nome },
    subject: "Sobre tu solicitud en Monarca Semijoyas",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #35605a;">Monarca Semijoyas</h2>
        <p>Hola <strong>${params.nome}</strong>,</p>
        <p>Gracias por tu interés en unirte a nuestra red de revendedoras.</p>
        <p>Lamentablemente, en esta oportunidad no podemos continuar con tu candidatura.</p>
        <p>Si tienes preguntas o deseas más información, puedes contactarnos directamente
           a través de nuestras redes sociales o por WhatsApp.</p>
        <p>Te agradecemos tu comprensión.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
        <p style="color:#aaa; font-size:12px;">Monarca Semijoyas · monarca.com.py</p>
      </div>
    `,
  });
}
