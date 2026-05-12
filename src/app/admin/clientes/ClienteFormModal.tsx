"use client";

import { useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { criarCliente, editarCliente } from "../actions-clientes";
import type { ClienteItem, ClienteFormData } from "@/lib/types";
import type { ActionResult } from "@/lib/action-utils";

interface ClienteFormModalProps {
  cliente?: ClienteItem | null;
  onClose: () => void;
  onSuccess: (cliente: ClienteItem) => void;
}

export function ClienteFormModal({ cliente, onClose, onSuccess }: ClienteFormModalProps) {
  const isEdit = Boolean(cliente);
  const [form, setForm] = useState<ClienteFormData>({
    nombre: cliente?.nombre ?? "",
    ruc: cliente?.ruc ?? "",
    ciudad: cliente?.ciudad ?? "",
    telefono: cliente?.telefono ?? "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ClienteFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      let result: ActionResult<ClienteItem>;
      if (isEdit && cliente) {
        result = await editarCliente(cliente.id, form);
      } else {
        result = await criarCliente(form);
      }

      setLoading(false);
      if (result.success) {
        onSuccess(result.data);
        onClose();
      } else {
        setError(result.error);
      }
    },
    [form, isEdit, cliente, onSuccess, onClose]
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "var(--admin-radius)",
          width: "100%",
          maxWidth: 480,
          padding: 24,
          margin: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--admin-text)", margin: 0 }}>
            {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} style={{ color: "var(--admin-text-muted)" }} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(224,92,92,0.1)",
              border: "1px solid var(--admin-danger)",
              borderRadius: "var(--admin-radius)",
              color: "var(--admin-danger)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: "var(--admin-radius)",
                color: "var(--admin-text)",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              RUC
            </label>
            <input
              type="text"
              required
              value={form.ruc}
              onChange={(e) => handleChange("ruc", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: "var(--admin-radius)",
                color: "var(--admin-text)",
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Ciudad
              </label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) => handleChange("ciudad", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "var(--admin-radius)",
                  color: "var(--admin-text)",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--admin-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "var(--admin-radius)",
                  color: "var(--admin-text)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
