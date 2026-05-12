"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import type { SyncPreview } from "@/lib/actions/estoque-sync";

interface StockSyncPreviewProps {
  preview: SyncPreview;
  onConfirm: () => void;
  onReset: () => void;
  syncing: boolean;
}

export function StockSyncPreview({ preview, onConfirm, onReset, syncing }: StockSyncPreviewProps) {
  const { matched, rejected } = preview;

  return (
    <div style={{
      border: "1px solid var(--admin-border)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        background: "var(--admin-bg-secondary)",
        borderBottom: "1px solid var(--admin-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, fontFamily: "Raleway, sans-serif" }}>
          Vista Previa de Sincronización
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 13, fontFamily: "Raleway, sans-serif" }}>
          <span style={{ color: "var(--admin-success, #22c55e)", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle size={14} />
            {matched.length} encontrados
          </span>
          {rejected.length > 0 && (
            <span style={{ color: "var(--admin-danger, #ef4444)", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={14} />
              {rejected.length} rechazados
            </span>
          )}
        </div>
      </div>

      {/* Matched Products Table */}
      {matched.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Raleway, sans-serif" }}>
            <thead style={{ background: "var(--admin-bg)" }}>
              <tr>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>SKU</th>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Nombre</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Stock Actual</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Nuevo Stock</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Precio Actual</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Nuevo Precio</th>
              </tr>
            </thead>
            <tbody>
              {matched.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>{m.sku}</td>
                  <td style={{ padding: "10px 12px" }}>{m.nome}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{m.currentStock}</td>
                  <td style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    color: m.newStock !== undefined && m.newStock !== m.currentStock ? "var(--admin-accent)" : "var(--admin-text)",
                    fontWeight: m.newStock !== undefined && m.newStock !== m.currentStock ? 600 : 400,
                  }}>
                    {m.newStock !== undefined ? m.newStock : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {m.currentPrice !== null ? `Gs. ${m.currentPrice.toLocaleString("es-PY")}` : "—"}
                  </td>
                  <td style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    color: m.newPrice !== undefined && m.newPrice !== m.currentPrice ? "var(--admin-accent)" : "var(--admin-text)",
                    fontWeight: m.newPrice !== undefined && m.newPrice !== m.currentPrice ? 600 : 400,
                  }}>
                    {m.newPrice !== null && m.newPrice !== undefined ? `Gs. ${m.newPrice.toLocaleString("es-PY")}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejected Products */}
      {rejected.length > 0 && (
        <div style={{ borderTop: "1px solid var(--admin-border)" }}>
          <div style={{
            padding: "12px 20px",
            background: "rgba(239, 68, 68, 0.05)",
            borderBottom: "1px solid var(--admin-border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <AlertCircle size={16} style={{ color: "var(--admin-danger, #ef4444)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-danger, #ef4444)", fontFamily: "Raleway, sans-serif" }}>
              Productos No Encontrados ({rejected.length})
            </span>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Raleway, sans-serif" }}>
              <thead style={{ background: "var(--admin-bg)" }}>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--admin-border)", fontWeight: 600 }}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{r.sku}</td>
                    <td style={{ padding: "8px 12px" }}>{r.nome}</td>
                    <td style={{ padding: "8px 12px", color: "var(--admin-muted)" }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: "16px 20px",
        background: "var(--admin-bg-secondary)",
        borderTop: "1px solid var(--admin-border)",
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
      }}>
        <button
          onClick={onReset}
          style={{
            padding: "10px 20px",
            background: "transparent",
            color: "var(--admin-text)",
            border: "1px solid var(--admin-border)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "Raleway, sans-serif",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={syncing || matched.length === 0}
          style={{
            padding: "10px 24px",
            background: syncing || matched.length === 0 ? "var(--admin-border)" : "var(--admin-accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: syncing || matched.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "Raleway, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {syncing ? (
            <>
              <span className="animate-spin">⏳</span>
              Sincronizando...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Confirmar Sincronización
            </>
          )}
        </button>
      </div>
    </div>
  );
}
