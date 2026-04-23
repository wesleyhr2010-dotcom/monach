"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarSeparado, marcarEntregado, cancelarSolicitacion } from "../actions";

export function SolicitudActions({ id, status }: { id: string; status: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleSeparado() {
        startTransition(async () => {
            await marcarSeparado(id);
            router.refresh();
        });
    }

    function handleEntregado() {
        startTransition(async () => {
            await marcarEntregado(id);
            router.refresh();
        });
    }

    function handleCancelar() {
        if (!confirm("¿Cancelar esta solicitud? Los puntos serán reembolsados.")) return;
        startTransition(async () => {
            await cancelarSolicitacion(id);
            router.refresh();
        });
    }

    if (isPending) {
        return (
            <div style={{ display: "flex", alignItems: "center", color: "#999", fontSize: 13 }}>
                Procesando...
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
            {status === "pendente" && (
                <>
                    <button
                        onClick={handleSeparado}
                        style={btnStyle("#5b8bf7")}
                    >
                        Marcar Separado
                    </button>
                    <button
                        onClick={handleCancelar}
                        style={btnStyle("#C0392B")}
                    >
                        Cancelar
                    </button>
                </>
            )}
            {status === "separado" && (
                <button
                    onClick={handleEntregado}
                    style={btnStyle("#27ae60")}
                >
                    Marcar Entregado
                </button>
            )}
            {(status === "entregado" || status === "cancelado") && (
                <span style={{ fontSize: 12, color: "#777", alignSelf: "center" }}>
                    Finalizado
                </span>
            )}
        </div>
    );
}

function btnStyle(color: string): React.CSSProperties {
    return {
        padding: "8px 14px",
        background: color,
        color: "#fff",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
    };
}
