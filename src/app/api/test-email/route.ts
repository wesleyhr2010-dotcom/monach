import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/emails";

// Endpoint de diagnóstico para testar envio de emails
// NÃO usar em produção — apenas para debug

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, test } = body;

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const results: Record<string, { success: boolean; error?: string; details?: string }> = {};

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
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
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
