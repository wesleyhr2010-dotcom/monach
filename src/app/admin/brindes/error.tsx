"use client";

import { useEffect } from "react";

export default function BrindesError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[BrindesPage Error]", error);
    }, [error]);

    return (
        <div className="admin-content" style={{ padding: 40 }}>
            <h1 style={{ color: "#e74c3c", fontSize: 20, marginBottom: 16 }}>
                Error al cargar Brindes
            </h1>
            <p style={{ color: "#ccc", marginBottom: 8 }}>
                <strong>Digest:</strong> {error.digest}
            </p>
            <p style={{ color: "#999", marginBottom: 24, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13 }}>
                {error.message}
            </p>
            {error.stack && (
                <pre style={{ color: "#777", fontSize: 12, overflow: "auto", maxHeight: 300, background: "#1a1a1a", padding: 16, borderRadius: 8 }}>
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
