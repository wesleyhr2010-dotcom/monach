"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { AdminAuthField } from "@/components/admin/auth/AdminAuthField";
import { AdminAuthButton } from "@/components/admin/auth/AdminAuthButton";

const T = {
  heading: "Bienvenida de vuelta",
  subtitle: "Ingresa con tus credenciales institucionales para acceder al panel.",
  labelEmail: "Correo Electrónico",
  labelPassword: "Contraseña",
  forgotPassword: "¿Olvidé mi contraseña?",
  submit: "Ingresar al Panel",
  submitting: "Ingresando...",
  divider: "Acceso Restringido",
  infoBox:
    "Este panel es exclusivo para Super Admin y Consultoras. Si eres revendedora, accede desde la app.",
  footer: "© 2026 Monarca Semijoyas — Todos los derechos reservados.",
} as const;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
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

      {/* Form card */}
      <form
        action={handleSubmit}
        style={{ width: "100%", maxWidth: "420px" }}
      >
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

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ marginBottom: "18px" }}>
            <AdminAuthField
              id="email"
              type="email"
              label={T.labelEmail}
              placeholder="admin@monarcasemijoyas.com"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <AdminAuthField
              id="password"
              type="password"
              label={T.labelPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
            />
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "28px" }}>
          <Link
            href="/admin/login/recuperar"
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#35605A",
              textDecoration: "none",
            }}
          >
            {T.forgotPassword}
          </Link>
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

        {/* Submit */}
        <AdminAuthButton type="submit" loading={isPending} disabled={isPending}>
          {isPending ? T.submitting : T.submit}
        </AdminAuthButton>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "28px",
            marginBottom: "28px",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#222222" }} />
          <span
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "11px",
              color: "#444444",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {T.divider}
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#222222" }} />
        </div>

        {/* Info box */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            backgroundColor: "#171717",
            border: "1px solid #2A2A2A",
            borderRadius: "10px",
            padding: "16px 20px",
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="#B4ABA2"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
            style={{ flexShrink: 0, marginTop: "1px", opacity: 0.5 }}
          >
            <circle cx="8" cy="8" r="7" />
            <path d="M8 7v4M8 5h.01" />
          </svg>
          <p
            style={{
              fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
              fontSize: "12px",
              color: "#555555",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {T.infoBox}
          </p>
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
    </>
  );
}
