"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";
import { AdminAuthField } from "@/components/admin/auth/AdminAuthField";
import { AdminAuthButton } from "@/components/admin/auth/AdminAuthButton";

const T = {
  heading: "Recuperar contraseña",
  subtitle: "Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.",
  labelEmail: "Correo Electrónico",
  placeholder: "admin@monarcasemijoyas.com",
  submit: "Enviar enlace de recuperación",
  submitting: "Enviando...",
  backToLogin: "Volver al inicio de sesión",
  successHeading: "¡Enlace enviado!",
  successMessage: "Revisá tu bandeja de entrada. Enviamos el enlace a:",
  successHint: "Si no lo ves, revisá la carpeta de Spam o Correo no deseado.",
  footer: "© 2026 Monarca Semijoyas — Todos los derechos reservados.",
} as const;

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8L10 13" />
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12L10 17L19 8" />
  </svg>
);

export function RecoveryForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const email = formData.get("email") as string;
    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSentEmail(email);
      }
    });
  }

  return (
    <>
      {/* Version badge */}
      <div
        style={{
          position: "absolute",
          top: "36px",
          right: "40px",
          display: "flex",
          gap: "4px",
          fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "#4A4A4A",
        }}
      >
        <span>v1.0</span>
        <span>·</span>
        <span>Admin</span>
      </div>

      <div style={{ width: "100%", maxWidth: "420px" }}>
        {sentEmail ? (
          /* ── Success state ────────────────────────────── */
          <div
            style={{
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
                margin: "0 0 8px",
              }}
            >
              {T.successMessage}
            </p>

            <p
              style={{
                fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#8BB5A8",
                margin: "0 0 24px",
                textAlign: "center",
              }}
            >
              {sentEmail}
            </p>

            <p
              style={{
                fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                fontSize: "13px",
                color: "#585858",
                lineHeight: 1.6,
                textAlign: "center",
                margin: "0 0 40px",
              }}
            >
              {T.successHint}
            </p>

            <div style={{ width: "100%", height: "1px", backgroundColor: "#1F2E2A", marginBottom: "40px" }} />

            <AdminAuthButton
              type="button"
              variant="outline"
              onClick={() => { window.location.href = "/admin/login"; }}
            >
              {T.backToLogin}
            </AdminAuthButton>
          </div>
        ) : (
          /* ── Default / loading state ──────────────────── */
          <form action={handleSubmit}>
            {/* Back link */}
            <Link
              href="/admin/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#35605A",
                textDecoration: "none",
                marginBottom: "48px",
              }}
            >
              <ChevronLeftIcon />
              {T.backToLogin}
            </Link>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                fontSize: "44px",
                fontWeight: 400,
                color: "#F5F0E8",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                margin: "0 0 16px",
              }}
            >
              {T.heading}
            </h1>

            <p
              style={{
                fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                fontSize: "15px",
                color: "#6A6A6A",
                lineHeight: 1.65,
                margin: "0 0 48px",
              }}
            >
              {T.subtitle}
            </p>

            {/* Email field */}
            <div style={{ marginBottom: "32px" }}>
              <AdminAuthField
                id="email"
                type="email"
                label={T.labelEmail}
                placeholder={T.placeholder}
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
                  fontSize: "13px",
                  color: "#ef4444",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            <AdminAuthButton type="submit" loading={isPending}>
              {isPending ? T.submitting : T.submit}
            </AdminAuthButton>
          </form>
        )}
      </div>

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
    </>
  );
}
