"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { AdminAuthField } from "@/components/admin/auth/AdminAuthField";
import { AdminAuthButton } from "@/components/admin/auth/AdminAuthButton";

type FormState = "idle" | "loading" | "success";
type VerifyState = "verifying" | "verified" | "error";

const T = {
  heading: "Restablecer contraseña",
  subtitle: "Definí una nueva contraseña para tu cuenta de administrador.",
  labelPassword: "Nueva contraseña",
  labelConfirm: "Confirmar contraseña",
  placeholder: "Mínimo 6 caracteres",
  submit: "Guardar contraseña",
  submitting: "Guardando...",
  backToLogin: "Volver al inicio de sesión",
  successHeading: "¡Contraseña actualizada!",
  successMessage: "Tu contraseña fue cambiada exitosamente. Te redirigimos al panel...",
  errorExpired: "El enlace puede haber vencido. Solicitá uno nuevo.",
  errorMismatch: "Las contraseñas no coinciden.",
  errorShort: "La contraseña debe tener al menos 6 caracteres.",
  errorUpdate: "Error al actualizar. El enlace puede haber vencido.",
  footer: "© 2026 Monarca Semijoyas — Todos los derechos reservados.",
} as const;

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12L10 17L19 8" />
  </svg>
);

export default function AdminResetPasswordPage() {
  const [state, setState] = useState<FormState>("idle");
  const [verifyState, setVerifyState] = useState<VerifyState>("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // PKCE flow: trocar code da URL por sessão
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error("[ResetPassword] exchangeCodeForSession error:", error.message);
          setVerifyState("error");
          setError(`${T.errorExpired} (${error.message})`);
        } else if (data.session) {
          console.log("[ResetPassword] Session established via PKCE");
          setVerifyState("verified");
        } else {
          setVerifyState("error");
          setError(T.errorExpired);
        }
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setVerifyState("error");
          setError(T.errorExpired);
        } else {
          setVerifyState("verified");
        }
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password.length < 6) {
      setError(T.errorShort);
      return;
    }

    if (password !== confirm) {
      setError(T.errorMismatch);
      return;
    }

    setState("loading");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error("[ResetPassword] updateUser error:", updateError.message);
      setState("idle");
      setError(`Error: ${updateError.message}`);
      return;
    }

    setState("success");

    setTimeout(() => {
      window.location.href = "/admin";
    }, 2000);
  }

  if (state === "success") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#141A18",
            border: "1px solid #1F2E2A",
            borderRadius: "10px",
            padding: "56px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#35605A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              flexShrink: 0,
            }}
          >
            <CheckIcon />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#F5F0E8",
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
              textAlign: "center",
            }}
          >
            {T.successHeading}
          </h2>

          <p
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "14px",
              color: "#6A6A6A",
              lineHeight: 1.6,
              textAlign: "center",
              margin: "0 0 32px",
            }}
          >
            {T.successMessage}
          </p>

          <Link
            href="/admin/login"
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#6A9A8A",
              textDecoration: "none",
            }}
          >
            {T.backToLogin}
          </Link>
        </div>

        <p
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
            fontSize: "11px",
            color: "#2A2A2A",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {T.footer}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ width: "100%", maxWidth: "420px" }}
      >
        {/* Verifying */}
        {verifyState === "verifying" && (
          <div style={{ marginBottom: "24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-raleway, 'Raleway', sans-serif)", fontSize: "14px", color: "#6A9A8A" }}>
              Verificando enlace...
            </p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "40px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "32px",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "#EDEDED",
              margin: 0,
            }}
          >
            {T.heading}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "14px",
              color: "#666666",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {T.subtitle}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#2A1818",
              border: "1px solid #3A2222",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                fontSize: "13px",
                color: "#ef4444",
                margin: 0,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px" }}>
          <AdminAuthField
            id="password"
            type="password"
            label={T.labelPassword}
            placeholder={T.placeholder}
            autoComplete="new-password"
            required
            disabled={state === "loading" || verifyState !== "verified"}
          />
          <AdminAuthField
            id="confirm"
            type="password"
            label={T.labelConfirm}
            placeholder={T.placeholder}
            autoComplete="new-password"
            required
            disabled={state === "loading" || verifyState !== "verified"}
          />
        </div>

        {/* Submit */}
        <AdminAuthButton type="submit" loading={state === "loading"} disabled={state === "loading" || verifyState !== "verified"}>
          {state === "loading" ? T.submitting : T.submit}
        </AdminAuthButton>

        {/* Back link */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
          <Link
            href="/admin/login"
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#35605A",
              textDecoration: "none",
            }}
          >
            {T.backToLogin}
          </Link>
        </div>
      </form>

      {/* Footer */}
      <p
        style={{
          position: "absolute",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
          fontSize: "11px",
          color: "#2A2A2A",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        {T.footer}
      </p>
    </div>
  );
}
