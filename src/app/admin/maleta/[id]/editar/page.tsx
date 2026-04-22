"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMaletaById,
  getAvailableVariants,
  adicionarItensMaleta,
} from "@/app/admin/actions-maletas";
import type { MaletaDetail } from "@/app/admin/actions-maletas";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { fmtCurrency } from "@/lib/maleta-helpers";
import { Plus, Minus, Package, Search } from "lucide-react";
import { useCallback } from "react";

interface VariantOption {
  id: string;
  attribute_name: string;
  attribute_value: string;
  price: number | null;
  stock_quantity: number;
  sku: string | null;
  product: { id: string; name: string; images: string[] };
}

interface AdditionalItem {
  variant: VariantOption;
  quantidade: number;
  isExisting: boolean; // true if already in the maleta
  existingMaletaItemId?: string;
}

export default function EditarMaletaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [maletaId, setMaletaId] = useState<string>("");
  const [maleta, setMaleta] = useState<MaletaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [search, setSearch] = useState("");
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);

  // Resolve params
  useEffect(() => {
    params.then((p) => setMaletaId(p.id));
  }, [params]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [maletaData, variantsData] = await Promise.all([
        getMaletaById(maletaId),
        getAvailableVariants(),
      ]);
      setMaleta(maletaData);
      setVariants(variantsData);
    } catch {
      setError("Error al cargar la consignación.");
    }
    setLoading(false);
  }, [maletaId]);

  // Load maleta and variants when id is ready
  useEffect(() => {
    if (!maletaId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [maletaId, loadData]);

  async function handleSearch(q: string) {
    setSearch(q);
    const data = await getAvailableVariants(q || undefined);
    setVariants(data);
  }

  function addAdditionalItem(variant: VariantOption) {
    setAdditionalItems((prev) => {
      if (prev.find((i) => i.variant.id === variant.id)) return prev;
      return [...prev, { variant, quantidade: 1, isExisting: false }];
    });
  }

  function removeAdditionalItem(variantId: string) {
    setAdditionalItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  }

  function updateAdditionalQty(variantId: string, delta: number) {
    setAdditionalItems((prev) =>
      prev.map((i) => {
        if (i.variant.id !== variantId) return i;
        const maxQty = i.isExisting
          ? i.variant.stock_quantity // existing items limited by current stock
          : i.variant.stock_quantity;
        const newQty = Math.max(1, Math.min(maxQty, i.quantidade + delta));
        return { ...i, quantidade: newQty };
      })
    );
  }

  async function handleConfirm() {
    if (additionalItems.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const result = await adicionarItensMaleta({
        maleta_id: maletaId,
        itens: additionalItems.map((i) => ({
          product_variant_id: i.variant.id,
          quantidade: i.quantidade,
        })),
      });
      if (result.success) {
        router.push(`/admin/maleta/${maletaId}`);
      } else {
        setError(result.error || "Error al guardar los cambios.");
        setSaving(false);
      }
    } catch {
      setError("Error inesperado");
      setSaving(false);
    }
  }

  // Map existing maleta items to know which variants are already in the maleta
  const existingVariantIds = new Set(maleta?.itens.map((i) => i.product_variant.id) ?? []);
  const additionalIds = new Set(additionalItems.map((i) => i.variant.id));

  const totalAdditionalValue = additionalItems.reduce(
    (sum, i) => sum + (i.variant.price || 0) * i.quantidade,
    0
  );
  const totalAdditionalPieces = additionalItems.reduce((s, i) => s + i.quantidade, 0);

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-loading">
          <div className="admin-spinner" />
        </div>
      </div>
    );
  }

  if (!maleta) {
    return (
      <div className="admin-content">
        <div className="admin-empty">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Consignación no encontrada</p>
          <Link href="/admin/maleta">
            <button className="admin-btn admin-btn-secondary mt-4">← Volver</button>
          </Link>
        </div>
      </div>
    );
  }

  const isEditable = maleta.status === "ativa" || maleta.status === "atrasada";

  return (
    <div className="admin-content">
      <AdminPageHeader
        title={`Editar Consignación #${maleta.numero}`}
        description={`Revendedora: ${maleta.reseller.name}`}
        backHref={`/admin/maleta/${maletaId}`}
      />

      {!isEditable && (
        <div className="admin-alert admin-alert-error">
          Esta consignación no puede ser editada porque su estado es {maleta.status}.
        </div>
      )}

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {/* Current items summary */}
      <div className="admin-card">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
          Artículos actuales de la consignación
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {maleta.itens.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
              Sin artículos
            </p>
          ) : (
            maleta.itens.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 8,
                  borderRadius: "var(--admin-radius)",
                  background: "var(--admin-bg)",
                }}
              >
                {item.product_variant.product.images?.[0] ? (
                  <img
                    src={item.product_variant.product.images[0]}
                    alt={item.product_variant.product.name}
                    className="admin-table-thumb"
                  />
                ) : (
                  <div
                    className="admin-table-thumb"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Package className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                    {item.product_variant.product.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                    {item.product_variant.attribute_value} · Cantidad: {item.quantidade_enviada} ·{" "}
                    {item.preco_fixado ? fmtCurrency(item.preco_fixado) : "S/P"}
                  </p>
                </div>
                {existingVariantIds.has(item.product_variant.id) && !additionalIds.has(item.product_variant.id) && (
                  <button
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                    onClick={() =>
                      addAdditionalItem({
                        id: item.product_variant.id,
                        attribute_name: item.product_variant.attribute_name,
                        attribute_value: item.product_variant.attribute_value,
                        price: item.preco_fixado,
                        stock_quantity: item.product_variant.stock_quantity,
                        sku: item.product_variant.sku,
                        product: item.product_variant.product,
                      })
                    }
                    disabled={!isEditable}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isEditable && (
        <>
          {/* Add new items section */}
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: 500,
                  overflowY: "auto",
                }}
              >
                {variants.filter((v) => !additionalIds.has(v.id) && v.stock_quantity > 0).length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    {search ? "Ningún resultado" : "Sin variantes con stock disponible"}
                  </p>
                ) : (
                  variants
                    .filter((v) => !additionalIds.has(v.id) && v.stock_quantity > 0)
                    .map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 8,
                          borderRadius: "var(--admin-radius)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--admin-surface-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        onClick={() => addAdditionalItem(v)}
                      >
                        {v.product.images?.[0] ? (
                          <img
                            src={v.product.images[0]}
                            alt={v.product.name}
                            className="admin-table-thumb"
                          />
                        ) : (
                          <div
                            className="admin-table-thumb"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                            }}
                          >
                            📦
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--admin-text)" }}
                          >
                            {v.product.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                            {v.attribute_value} · Stock: {v.stock_quantity} ·{" "}
                            {v.price ? fmtCurrency(v.price) : "S/P"}
                          </p>
                        </div>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            addAdditionalItem(v);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Right: Additional items to add */}
            <div className="admin-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--admin-text)" }}
                >
                  Artículos a añadir ({additionalItems.length})
                </h3>
                {additionalItems.length > 0 && (
                  <span
                    style={{
                      background: "rgba(180, 171, 162, 0.15)",
                      color: "var(--admin-accent)",
                      padding: "2px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Total: {fmtCurrency(totalAdditionalValue)}
                  </span>
                )}
              </div>

              {additionalItems.length === 0 ? (
                <AdminEmptyState
                  icon={Package}
                  title="Selecciona productos"
                  description="Haz clic en un producto de la lista izquierda o en el botón + junto a un artículo existente para agregarlo."
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    maxHeight: 500,
                    overflowY: "auto",
                  }}
                >
                  {additionalItems.map((item) => (
                    <div
                      key={item.variant.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 8,
                        background: "var(--admin-bg)",
                        borderRadius: "var(--admin-radius)",
                      }}
                    >
                      {item.variant.product.images?.[0] ? (
                        <img
                          src={item.variant.product.images[0]}
                          alt={item.variant.product.name}
                          className="admin-table-thumb"
                        />
                      ) : (
                        <div
                          className="admin-table-thumb"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="text-sm font-medium truncate">
                          {item.variant.product.name}
                          {item.isExisting && (
                            <span
                              className="text-xs ml-1"
                              style={{ color: "var(--admin-accent)" }}
                            >
                              (adicional)
                            </span>
                          )}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--admin-text-muted)" }}
                        >
                          {item.variant.attribute_value} ·{" "}
                          {item.variant.price
                            ? fmtCurrency(item.variant.price * item.quantidade)
                            : "S/P"}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          className="admin-btn admin-btn-icon"
                          onClick={() => updateAdditionalQty(item.variant.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span
                          className="text-sm font-medium"
                          style={{ width: 24, textAlign: "center" }}
                        >
                          {item.quantidade}
                        </span>
                        <button
                          className="admin-btn admin-btn-icon"
                          onClick={() => updateAdditionalQty(item.variant.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        className="admin-btn admin-btn-icon"
                        style={{ color: "var(--admin-danger)" }}
                        onClick={() => removeAdditionalItem(item.variant.id)}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary and actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderRadius: "var(--admin-radius)",
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div>
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                Artículos nuevos: <strong>{totalAdditionalPieces}</strong> · Total adicional:{" "}
                <strong style={{ color: "var(--admin-accent)" }}>
                  {fmtCurrency(totalAdditionalValue)}
                </strong>
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href={`/admin/maleta/${maletaId}`}>
                <button className="admin-btn admin-btn-secondary">← Cancelar</button>
              </Link>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleConfirm}
                disabled={saving || additionalItems.length === 0}
                style={{ background: "var(--admin-success)", color: "#0f0f0f" }}
              >
                {saving ? "Guardando..." : "✓ Guardar Cambios"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
