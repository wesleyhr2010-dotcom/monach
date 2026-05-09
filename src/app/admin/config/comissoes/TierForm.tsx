"use client";

import { useState, useTransition } from "react";
import { upsertCommissionTier } from "../../actions-config";
import { toast } from "sonner";

interface Tier {
  id: string;
  min_sales_value: number;
  pct: number;
  ativo: boolean;
}

interface TierFormProps {
  tier?: Tier;
  onClose: () => void;
  onSaved: () => void;
}

export default function TierForm({ tier, onClose, onSaved }: TierFormProps) {
  const [minSales, setMinSales] = useState(tier?.min_sales_value ?? 0);
  const [pct, setPct] = useState(tier?.pct ?? 10);
  const [ativo, setAtivo] = useState(tier?.ativo ?? true);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertCommissionTier({
        id: tier?.id,
        min_sales_value: minSales,
        pct,
        ativo,
      });
      if (result.success) {
        toast.success(tier ? "Faixa actualizada" : "Faixa creada");
        onSaved();
      } else {
        toast.error(result.error || "Error al guardar");
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
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
          borderRadius: 12,
          padding: "24px",
          width: "100%",
          maxWidth: "420px",
          color: "var(--admin-text)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "var(--admin-text)" }}>
          {tier ? "Editar Faixa" : "Nova Faixa de Comissão"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="admin-label">Mínimo de ventas (Gs)</label>
            <input
              type="number"
              min={0}
              value={minSales}
              onChange={(e) => setMinSales(Number(e.target.value))}
              className="admin-input"
              required
            />
          </div>

          <div>
            <label className="admin-label">Comisión (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="admin-input"
              required
              style={{ width: "100px" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            Activo
          </label>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="admin-btn admin-btn-primary admin-btn-sm"
            >
              {isPending ? "Guardando..." : tier ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
