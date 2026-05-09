"use client";

import { useState } from "react";
import { cancelarVenta } from "@/app/admin/actions-ventas";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

type Props = {
  ventaId: string;
  ventaResumen: { cliente: string; total: string; cantidad: number };
  onCancel: () => void;
};

export function CancelarVentaModal({ ventaId, ventaResumen, onCancel }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const result = await cancelarVenta(ventaId);
    setLoading(false);
    setOpen(false);
    if (result.success) {
      toast.success("Venta cancelada correctamente");
      onCancel();
    } else {
      toast.error(result.error || "No se pudo cancelar la venta");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-danger"
        type="button"
      >
        Cancelar Venta
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)",
        }}>
          <div style={{
            background: "var(--admin-surface-elevated)",
            borderRadius: "var(--admin-radius)",
            border: "1px solid var(--admin-border)",
            padding: 24, maxWidth: 420, width: "90%",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={20} color="var(--admin-danger)" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--admin-text)" }}>
                Confirmar Cancelación
              </h3>
            </div>
            <p style={{ color: "var(--admin-text-muted)", fontSize: 14, margin: 0 }}>
              ¿Estás seguro de que querés cancelar esta venta? Se devolverá el stock al inventario.
            </p>
            <div style={{ background: "var(--admin-surface)", borderRadius: "var(--admin-radius)", padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Cliente: <strong style={{ color: "var(--admin-text)" }}>{ventaResumen.cliente}</strong></span>
              <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Total: <strong style={{ color: "var(--admin-text)" }}>{ventaResumen.total}</strong></span>
              <span style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>Items: <strong style={{ color: "var(--admin-text)" }}>{ventaResumen.cantidad}</strong></span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} className="admin-btn admin-btn-secondary" type="button" disabled={loading}>
                Volver
              </button>
              <button onClick={handleConfirm} className="admin-btn admin-btn-danger" type="button" disabled={loading}>
                {loading ? "Cancelando..." : "Confirmar Cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
