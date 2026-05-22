"use client";

import { useEffect } from "react";

export default function MiCuentaError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[MiCuenta Error]", error);
    }, [error]);

    return (
        <div style={{ padding: 40 }}>
            <h1 style={{ color: "#e74c3c", fontSize: 20, marginBottom: 16 }}>
                Error al cargar Mi Cuenta
            </h1>
            <p style={{ color: "var(--admin-text-muted)", marginBottom: 8 }}>
                <strong>Digest:</strong> {error.digest}
            </p>
            <p style={{
                color: "var(--admin-text-muted)",
                marginBottom: 24,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: 13,
            }}>
                {error.message}
            </p>
            {error.stack && (
                <pre style={{
                    color: "var(--admin-text-muted)",
                    fontSize: 12,
                    overflow: "auto",
                    maxHeight: 300,
                    background: "var(--admin-surface)",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid var(--admin-border)",
                }}>
                    {error.stack}
                </pre>
            )}
            <button
                onClick={reset}
                style={{
                    marginTop: 24,
                    padding: "10px 20px",
                    background: "#35605A",
                    color: "#fff",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                Reintentar
            </button>
        </div>
    );
}
