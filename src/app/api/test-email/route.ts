import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/emails";
import {
  emailConviteUsuario,
  emailCandidaturaAprovada,
  emailCandidaturaRechazada,
  emailAcertoConfirmado,
  emailDocumentoAprovado,
  emailDocumentoPendente,
  emailDocumentoRejeitado,
} from "@/lib/email-templates";

// Endpoint de diagnóstico para testar envio de emails
// NÃO usar em produção — apenas para debug

function isDevOrTest(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_TEST_EMAIL === "true"
  );
}

export async function POST(request: Request) {
  try {
    if (!isDevOrTest()) {
      return NextResponse.json(
        { error: "Endpoint disponível apenas em desenvolvimento" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, test, template, data } = body;

    const results: Record<string, unknown> = {};

    // Modo preview-all: renderiza todos os 7 templates localmente (sem enviar)
    if (test === "preview-all") {
      const previews = await Promise.all([
        emailConviteUsuario({
          email: "test@example.com",
          nome: "María",
          linkDefinirSenha: "https://example.com/reset",
          senhaTemporaria: "Temp1234",
          tipo: "revendedora",
        }).then((content) => ({
          template: "emailConviteUsuario",
          subject: "🦋 ¡Bienvenida a Monarca Semijoyas!",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailCandidaturaAprovada({
          email: "test@example.com",
          nome: "Ana",
          senhaTemp: "Pass1234",
        }).then((content) => ({
          template: "emailCandidaturaAprovada",
          subject: "🦋 ¡Bienvenida a Monarca Semijoyas!",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailCandidaturaRechazada({
          email: "test@example.com",
          nome: "Lucía",
        }).then((content) => ({
          template: "emailCandidaturaRechazada",
          subject: "Sobre tu solicitud en Monarca Semijoyas",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailAcertoConfirmado(
          "test@example.com",
          "Carla",
          42,
          "Gs. 1.500.000",
          "Gs. 300.000",
          20
        ).then((content) => ({
          template: "emailAcertoConfirmado",
          subject: "✅ Consignación #42 confirmada — Monarca",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailDocumentoAprovado(
          "test@example.com",
          "Sofía",
          "Cédula de identidad"
        ).then((content) => ({
          template: "emailDocumentoAprovado",
          subject: "✅ Tu documento fue aprobado — Monarca",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailDocumentoPendente(
          "Julieta",
          "uuid-123",
          "Comprobante de domicilio",
          [{ email: "admin@example.com", name: "Admin" }]
        ).then((content) => ({
          template: "emailDocumentoPendente",
          subject: "📄 Nuevo documento para revisar — Julieta",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
        emailDocumentoRejeitado(
          "test@example.com",
          "Martina",
          "Cédula de identidad",
          "La imagen no es legible. Por favor, subí una foto más clara."
        ).then((content) => ({
          template: "emailDocumentoRejeitado",
          subject: "❌ Tu documento necesita corrección — Monarca",
          html: content.html.slice(0, 500) + "...",
          text: content.text.slice(0, 300) + "...",
        })),
      ]);
      return NextResponse.json({ previews }, { status: 200 });
    }

    // Modo preview: renderiza um template específico com dados mock
    if (test === "preview" && template) {
      let result: { html: string; text: string } | null = null;

      switch (template) {
        case "emailConviteUsuario":
          result = await emailConviteUsuario({
            email: data?.email ?? "test@example.com",
            nome: data?.nome ?? "María",
            linkDefinirSenha: data?.linkDefinirSenha ?? null,
            senhaTemporaria: data?.senhaTemporaria ?? "Temp1234",
            tipo: data?.tipo ?? "revendedora",
          });
          break;
        case "emailCandidaturaAprovada":
          result = await emailCandidaturaAprovada({
            email: data?.email ?? "test@example.com",
            nome: data?.nome ?? "Ana",
            senhaTemp: data?.senhaTemp ?? "Pass1234",
          });
          break;
        case "emailCandidaturaRechazada":
          result = await emailCandidaturaRechazada({
            email: data?.email ?? "test@example.com",
            nome: data?.nome ?? "Lucía",
          });
          break;
        case "emailAcertoConfirmado":
          result = await emailAcertoConfirmado(
            data?.resellerEmail ?? "test@example.com",
            data?.resellerName ?? "Carla",
            data?.maletaNumero ?? 42,
            data?.valorVendido ?? "Gs. 1.500.000",
            data?.comissao ?? "Gs. 300.000",
            data?.pctComissao ?? 20
          );
          break;
        case "emailDocumentoAprovado":
          result = await emailDocumentoAprovado(
            data?.resellerEmail ?? "test@example.com",
            data?.resellerName ?? "Sofía",
            data?.tipoDocumento ?? "Cédula de identidad"
          );
          break;
        case "emailDocumentoPendente":
          result = await emailDocumentoPendente(
            data?.resellerName ?? "Julieta",
            data?.resellerId ?? "uuid-123",
            data?.tipoDocumento ?? "Comprobante de domicilio",
            data?.destinatarios ?? [{ email: "admin@example.com", name: "Admin" }]
          );
          break;
        case "emailDocumentoRejeitado":
          result = await emailDocumentoRejeitado(
            data?.resellerEmail ?? "test@example.com",
            data?.resellerName ?? "Martina",
            data?.tipoDocumento ?? "Cédula de identidad",
            data?.motivo ?? "La imagen no es legible. Por favor, subí una foto más clara."
          );
          break;
        default:
          return NextResponse.json(
            { error: `Template desconhecido: ${template}` },
            { status: 400 }
          );
      }

      return NextResponse.json(
        {
          template,
          html: result?.html?.slice(0, 2000) + "...",
          text: result?.text?.slice(0, 1000) + "...",
        },
        { status: 200 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    // Teste 1: Enviar email via Brevo API (nosso código)
    if (test === "all" || test === "brevo") {
      try {
        await sendEmail({
          to: { email, name: "Teste" },
          subject: "🧪 Teste de email — Monarca",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #35605a;">🧪 Email de teste</h2>
              <p>Este é um email de teste enviado via Brevo API.</p>
              <p>Se você recebeu, a configuração da API está funcionando.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #aaa; font-size: 12px;">Monarca Semijoyas · ${new Date().toISOString()}</p>
            </div>
          `,
        });
        results.brevo = { success: true, details: "Email enviado via Brevo API" };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        results.brevo = { success: false, error: msg };
      }
    }

    // Teste 2: Verificar configuração do Supabase Auth (tentar criar link de recovery)
    if (test === "all" || test === "supabase") {
      try {
        const supabaseAdmin = createServerClient();
        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app/nueva-contrasena`,
          },
        });

        if (error) {
          results.supabase = { success: false, error: error.message };
        } else {
          results.supabase = {
            success: true,
            details: "Link de recovery gerado com sucesso",
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        results.supabase = { success: false, error: msg };
      }
    }

    // Teste 3: Verificar variáveis de ambiente
    results.env = {
      success: true,
      details: JSON.stringify({
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? "✅ configurado" : "❌ ausente",
        BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL ? "✅ configurado" : "❌ ausente",
        BREVO_API_KEY: process.env.BREVO_API_KEY ? `✅ ${process.env.BREVO_API_KEY.substring(0, 20)}...` : "❌ ausente",
        BREVO_FROM_NAME: process.env.BREVO_FROM_NAME ? "✅ configurado" : "❌ ausente",
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ configurado" : "❌ ausente",
      }),
    };

    return NextResponse.json({ results }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
