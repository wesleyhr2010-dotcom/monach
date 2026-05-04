"use client";

import { useState, useTransition } from "react";
import { deleteCommissionTier } from "../../actions-config";
import TierForm from "./TierForm";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface Tier {
  id: string;
  min_sales_value: number;
  pct: number;
  ativo: boolean;
}

interface ComissoesClientProps {
  initialTiers: Tier[];
}

export default function ComissoesClient({ initialTiers }: ComissoesClientProps) {
  const [tiers, setTiers] = useState(initialTiers);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta faixa?")) return;
    startTransition(async () => {
      const result = await deleteCommissionTier(id);
      if (result.success) {
        toast.success("Faixa eliminada");
        setTiers((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  function handleSaved() {
    setShowForm(false);
    setEditingTier(null);
    // Recarregar dados
    window.location.reload();
  }

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => {
            setEditingTier(null);
            setShowForm(true);
          }}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          <Plus size={14} /> Nova Faixa
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mínimo de ventas (Gs)</th>
              <th>Comisión (%)</th>
              <th>Estado</th>
              <th style={{ width: "100px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--admin-text-muted)" }}>
                  <AlertTriangle size={20} style={{ marginBottom: "8px" }} />
                  <p>Nenhuma faixa cadastrada.</p>
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id}>
                  <td style={{ fontWeight: 600 }}>
                    {tier.min_sales_value.toLocaleString("es-PY")}
                  </td>
                  <td>{tier.pct}%</td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: tier.ativo ? "rgba(74,222,128,0.12)" : "rgba(100,100,100,0.12)",
                        color: tier.ativo ? "#4ADE80" : "#888",
                      }}
                    >
                      {tier.ativo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          setEditingTier(tier);
                          setShowForm(true);
                        }}
                        className="admin-btn admin-btn-icon admin-btn-sm"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        disabled={isPending || tier.min_sales_value === 0}
                        className="admin-btn admin-btn-icon admin-btn-sm"
                        title={tier.min_sales_value === 0 ? "No se puede eliminar la faixa base" : "Eliminar"}
                        style={{ opacity: tier.min_sales_value === 0 ? 0.4 : 1 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TierForm
          tier={editingTier ?? undefined}
          onClose={() => {
            setShowForm(false);
            setEditingTier(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
