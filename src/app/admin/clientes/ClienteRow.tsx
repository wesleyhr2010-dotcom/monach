"use client";

import { Users } from "lucide-react";
import type { ClienteItem } from "@/lib/types";

interface ClienteRowProps {
  cliente: ClienteItem;
  onEdit: (cliente: ClienteItem) => void;
}

export function ClienteRow({ cliente, onEdit }: ClienteRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
        background: "var(--admin-surface)",
        borderRadius: "var(--admin-radius)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--admin-radius)",
          background: "var(--admin-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Users size={18} style={{ color: "var(--admin-text-muted)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--admin-text)" }}>
            {cliente.nombre}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "2px 8px",
              borderRadius: 4,
              background: cliente.origen === "LOJA" ? "var(--admin-accent)" : "var(--admin-border)",
              color: cliente.origen === "LOJA" ? "white" : "var(--admin-text-muted)",
            }}
          >
            {cliente.origen === "LOJA" ? "Loja" : "Revendedoras"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--admin-text-muted)" }}>
          <span>RUC: {cliente.ruc || "—"}</span>
          <span>{cliente.ciudad || "—"}</span>
          <span>{cliente.telefono || "—"}</span>
        </div>
      </div>
      {cliente.origen === "LOJA" && (
        <button
          onClick={() => onEdit(cliente)}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          Editar
        </button>
      )}
    </div>
  );
}
