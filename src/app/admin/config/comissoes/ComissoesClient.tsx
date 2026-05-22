"use client";

import { useState, useTransition } from "react";
import { deleteCommissionTier } from "../../actions-config";
import TierForm from "./TierForm";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
    if (!confirm("¿Eliminar esta franja?")) return;
    startTransition(async () => {
      const result = await deleteCommissionTier(id);
      if (result.success) {
        toast.success("Franja eliminada");
        setTiers((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  function handleSaved() {
    setShowForm(false);
    setEditingTier(null);
    window.location.reload();
  }

  return (
    <>
      <AdminSectionCard
        title="Franjas de Comisión"
        action={
          <button
            className="admin-btn admin-btn-primary admin-btn-sm"
            onClick={() => { setEditingTier(null); setShowForm(true); }}
          >
            <Plus size={14} /> Nueva Franja
          </button>
        }
        noPadContent
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mínimo de ventas (Gs)</th>
              <th>Comisión (%)</th>
              <th>Estado</th>
              <th style={{ width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                  Ninguna franja registrada.
                </td>
              </tr>
            ) : tiers.map((tier) => (
              <tr key={tier.id}>
                <td style={{ fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                  {tier.min_sales_value.toLocaleString("es-PY")}
                </td>
                <td>{tier.pct}%</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 4,
                    background: tier.ativo ? "var(--admin-success-10)" : "var(--admin-muted-10)",
                    color: tier.ativo ? "var(--admin-success)" : "var(--admin-text-muted)",
                  }}>
                    {tier.ativo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="admin-btn admin-btn-icon"
                      title="Editar"
                      onClick={() => { setEditingTier(tier); setShowForm(true); }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="admin-btn admin-btn-icon"
                      title={tier.min_sales_value === 0 ? "No se puede eliminar la franja base" : "Eliminar"}
                      style={{ color: "var(--admin-danger)", opacity: tier.min_sales_value === 0 ? 0.4 : 1 }}
                      onClick={() => handleDelete(tier.id)}
                      disabled={isPending || tier.min_sales_value === 0}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminSectionCard>

      {showForm && (
        <TierForm
          tier={editingTier ?? undefined}
          onClose={() => { setShowForm(false); setEditingTier(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
