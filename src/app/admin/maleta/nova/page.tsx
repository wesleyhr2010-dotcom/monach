"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getActiveResellers,
  getAvailableVariants,
  criarMaleta,
} from "@/app/admin/actions-maletas";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStepIndicator } from "@/components/admin/AdminStepIndicator";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { fmtCurrency } from "@/lib/maleta-helpers";
import { Plus, Minus, Trash2, Package, CheckCircle, Search } from "lucide-react";

interface ResellerOption {
  id: string;
  name: string;
  avatar_url: string;
  whatsapp: string;
  taxa_comissao: number;
}

interface VariantOption {
  id: string;
  attribute_name: string;
  attribute_value: string;
  price: number | null;
  stock_quantity: number;
  sku: string | null;
  product: { id: string; name: string; images: string[] };
}

interface SelectedItem {
  variant: VariantOption;
  quantidade: number;
}

const STEPS = [
  { label: "Revendedora" },
  { label: "Prazo" },
  { label: "Produtos" },
  { label: "Confirmar" },
];

export default function NovaMaletaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [resellers, setResellers] = useState<ResellerOption[]>([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");

  const [dataLimite, setDataLimite] = useState("");

  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => { getActiveResellers().then(setResellers); }, []);

  useEffect(() => {
    if (step === 2) loadVariants("");
  }, [step]);

  async function loadVariants(q: string) {
    const data = await getAvailableVariants(q || undefined);
    setVariants(data);
  }

  function handleSearch(q: string) {
    setSearch(q);
    loadVariants(q);
  }

  function addItem(variant: VariantOption) {
    if (selectedItems.find((i) => i.variant.id === variant.id)) return;
    setSelectedItems((prev) => [...prev, { variant, quantidade: 1 }]);
  }

  function removeItem(variantId: string) {
    setSelectedItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  }

  function updateQty(variantId: string, delta: number) {
    setSelectedItems((prev) =>
      prev.map((i) => {
        if (i.variant.id !== variantId) return i;
        const newQty = Math.max(1, Math.min(i.variant.stock_quantity, i.quantidade + delta));
        return { ...i, quantidade: newQty };
      })
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return !!selectedResellerId;
    if (step === 1) return !!dataLimite;
    if (step === 2) return selectedItems.length > 0;
    return true;
  }

  const selectedReseller = resellers.find((r) => r.id === selectedResellerId);
  const totalValue = selectedItems.reduce((sum, i) => sum + (i.variant.price || 0) * i.quantidade, 0);
  const selectedIds = new Set(selectedItems.map((i) => i.variant.id));

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const result = await criarMaleta(
        selectedResellerId,
        dataLimite,
        selectedItems.map((i) => ({
          product_variant_id: i.variant.id,
          quantidade: i.quantidade,
        }))
      );
      if (result.success && result.id) {
        router.push(`/admin/maleta/${result.id}`);
      } else {
        setError(result.error || "Error al crear la consignación");
        setSaving(false);
      }
    } catch {
      setError("Error inesperado");
      setSaving(false);
    }
  }

  return (
    <div className="admin-content">
      <AdminPageHeader
        title="Nueva Consignación"
        description="Crear consignación para revendedora"
        backHref="/admin/maleta"
      />

      <AdminStepIndicator steps={STEPS} currentStep={step} />

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {/* Step 1: Select Reseller */}
      {step === 0 && (
        <div className="admin-card">
          <label className="admin-label">Selecionar Revendedora</label>
          <select
            className="admin-select"
            value={selectedResellerId}
            onChange={(e) => setSelectedResellerId(e.target.value)}
          >
            <option value="">Escoja una revendedora...</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.taxa_comissao}%)
              </option>
            ))}
          </select>

          {selectedReseller && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, padding: 12, background: "var(--admin-bg)", borderRadius: "var(--admin-radius)" }}>
              <AdminAvatar src={selectedReseller.avatar_url} name={selectedReseller.name} size="md" />
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--admin-text)" }}>{selectedReseller.name}</p>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  WhatsApp: {selectedReseller.whatsapp} · Comisión: {selectedReseller.taxa_comissao}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Deadline */}
      {step === 1 && (
        <div className="admin-card">
          <label className="admin-label">Data Limite para Devolución</label>
          <input
            type="date"
            className="admin-input"
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
            style={{ maxWidth: 320 }}
            min={new Date().toISOString().split("T")[0]}
          />
          {dataLimite && (
            <p className="text-sm mt-3" style={{ color: "var(--admin-text-muted)" }}>
              La revendedora tendrá hasta{" "}
              <strong style={{ color: "var(--admin-text)" }}>
                {new Date(dataLimite + "T12:00:00").toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })}
              </strong>{" "}
              para devolver la consignación.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Select Products */}
      {step === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Available variants */}
          <div className="admin-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Search className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="admin-input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
              {variants.filter((v) => !selectedIds.has(v.id)).length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--admin-text-muted)" }}>
                  {search ? "Ningún resultado" : "Sin variantes con stock"}
                </p>
              ) : (
                variants.filter((v) => !selectedIds.has(v.id)).map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: 8,
                      borderRadius: "var(--admin-radius)", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={() => addItem(v)}
                  >
                    {v.product.images?.[0] ? (
                      <img src={v.product.images[0]} alt={v.product.name} className="admin-table-thumb" />
                    ) : (
                      <div className="admin-table-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>{v.product.name}</p>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {v.attribute_value} · Stock: {v.stock_quantity} · {v.price ? fmtCurrency(v.price) : "S/P"}
                      </p>
                    </div>
                    <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={(e) => { e.stopPropagation(); addItem(v); }}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Selected items */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                Ítems Seleccionados ({selectedItems.length})
              </h3>
              {selectedItems.length > 0 && (
                <span style={{
                  background: "rgba(180, 171, 162, 0.15)", color: "var(--admin-accent)",
                  padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                }}>
                  Total: {fmtCurrency(totalValue)}
                </span>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <AdminEmptyState icon={Package} title="Selecciona productos" description="Haz clic en un producto de la lista izquierda para agregarlo." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                {selectedItems.map((item) => (
                  <div
                    key={item.variant.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: 8,
                      background: "var(--admin-bg)", borderRadius: "var(--admin-radius)",
                    }}
                  >
                    {item.variant.product.images?.[0] ? (
                      <img src={item.variant.product.images[0]} alt={item.variant.product.name} className="admin-table-thumb" />
                    ) : (
                      <div className="admin-table-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="text-sm font-medium truncate">{item.variant.product.name}</p>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {item.variant.attribute_value} · {item.variant.price ? fmtCurrency(item.variant.price * item.quantidade) : "S/P"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button className="admin-btn admin-btn-icon" onClick={() => updateQty(item.variant.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium" style={{ width: 24, textAlign: "center" }}>{item.quantidade}</span>
                      <button className="admin-btn admin-btn-icon" onClick={() => updateQty(item.variant.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button className="admin-btn admin-btn-icon" style={{ color: "var(--admin-danger)" }} onClick={() => removeItem(item.variant.id)}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Summary / Confirm */}
      {step === 3 && (
        <div className="admin-card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-text)" }}>Resumen de la Consignación</h3>

          {selectedReseller && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--admin-bg)", borderRadius: "var(--admin-radius)", marginBottom: 16 }}>
              <AdminAvatar src={selectedReseller.avatar_url} name={selectedReseller.name} size="md" />
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--admin-text)" }}>{selectedReseller.name}</p>
                <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Prazo: {new Date(dataLimite + "T12:00:00").toLocaleDateString("es-PY")} · Comisión: {selectedReseller.taxa_comissao}%
                </p>
              </div>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Variante</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  <th style={{ textAlign: "right" }}>Precio Unit.</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.variant.id}>
                    <td className="text-sm font-medium">{item.variant.product.name}</td>
                    <td className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{item.variant.attribute_value}</td>
                    <td className="text-sm" style={{ textAlign: "right" }}>{item.quantidade}</td>
                    <td className="text-sm" style={{ textAlign: "right" }}>{item.variant.price ? fmtCurrency(item.variant.price) : "—"}</td>
                    <td className="text-sm font-medium" style={{ textAlign: "right" }}>{item.variant.price ? fmtCurrency(item.variant.price * item.quantidade) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--admin-border)" }}>
            <span className="font-semibold">Total ({selectedItems.reduce((s, i) => s + i.quantidade, 0)} piezas)</span>
            <span className="text-lg font-bold" style={{ color: "var(--admin-accent)" }}>{fmtCurrency(totalValue)}</span>
          </div>

          <div className="admin-alert admin-alert-warning" style={{ marginTop: 16 }}>
            ⚠️ El stock será reservado inmediatamente.
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          ← Anterior
        </button>

        {step < 3 ? (
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Próximo: {STEPS[step + 1]?.label} →
          </button>
        ) : (
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleConfirm}
            disabled={saving}
            style={{ background: "var(--admin-success)", color: "#0f0f0f" }}
          >
            {saving ? "Creando..." : "✓ Confirmar y Crear Consignación"}
          </button>
        )}
      </div>
    </div>
  );
}