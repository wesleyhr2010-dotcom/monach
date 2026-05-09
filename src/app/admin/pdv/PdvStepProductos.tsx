"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { Package, Minus, Plus, Trash2, Search } from "lucide-react";
import { getVariantsParaPdv, type VariantParaPdv } from "@/app/admin/actions-pdv";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import type { CarritoItem } from "./PdvClient";

type Props = {
  carrito: CarritoItem[];
  setCarrito: (items: CarritoItem[]) => void;
  categorias: Array<{ id: string; name: string }>;
};

function formatGs(value: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0, useGrouping: true }).format(value);
}

export default function PdvStepProductos({ carrito, setCarrito, categorias }: Props) {
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [variants, setVariants] = useState<VariantParaPdv[]>([]);
  const [isPendingLoad, startLoad] = useTransition();
  const [stockError, setStockError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    runLoad(search, categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runLoad(value, categoryId);
    }, 400);
  }

  function runLoad(searchValue: string, catValue: string) {
    startLoad(async () => {
      const result = await getVariantsParaPdv({
        search: searchValue.trim() || undefined,
        categoryId: catValue !== "all" ? catValue : undefined,
      });
      if (result.success) setVariants(result.data);
    });
  }

  function isInCart(variantId: string): boolean {
    return carrito.some((c) => c.variantId === variantId);
  }

  function handleAdd(variant: VariantParaPdv) {
    setStockError(null);
    if (isInCart(variant.id)) return;
    if (variant.stock_quantity < 1) {
      setStockError(`Stock insuficiente. Solo hay ${variant.stock_quantity} unidad(es) disponible(s).`);
      return;
    }
    const precio = variant.price ?? 0;
    setCarrito([
      ...carrito,
      {
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        productImage: variant.product.images[0] ?? null,
        attributeName: variant.attribute_name,
        attributeValue: variant.attribute_value,
        precioPyg: precio,
        cantidad: 1,
        stockMaximo: variant.stock_quantity,
      },
    ]);
  }

  function handleIncrement(variantId: string) {
    setStockError(null);
    setCarrito(
      carrito.map((c) =>
        c.variantId === variantId
          ? { ...c, cantidad: c.cantidad + 1 > c.stockMaximo ? c.cantidad : c.cantidad + 1 }
          : c
      )
    );
  }

  function handleDecrement(variantId: string) {
    setCarrito(
      carrito
        .map((c) =>
          c.variantId === variantId ? { ...c, cantidad: Math.max(1, c.cantidad - 1) } : c
        )
    );
  }

  function handleRemove(variantId: string) {
    setCarrito(carrito.filter((c) => c.variantId !== variantId));
  }

  const totalCarritoPyg = carrito.reduce((acc, c) => acc + Math.round(c.precioPyg * c.cantidad), 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Coluna esquerda: busca + lista */}
      <div className="admin-card">
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
          Agregá productos a la venta
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4" style={{ color: "var(--admin-text-muted)" }} />
            <input
              type="text"
              className="admin-input"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="pdv-cat" className="text-sm" style={{ color: "var(--admin-text-muted)" }}>Categoría</label>
            <select
              id="pdv-cat"
              className="admin-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {stockError && <div className="admin-alert admin-alert-error mb-3">{stockError}</div>}

        <div style={{ maxHeight: "480px", overflowY: "auto" }}>
          {isPendingLoad && variants.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>Cargando...</p>
          ) : variants.length === 0 ? (
            search.trim().length > 0 ? (
              <AdminEmptyState
                icon={Package}
                title={`No encontramos productos con "${search.trim()}".`}
              />
            ) : (
              <AdminEmptyState
                icon={Package}
                title="Sin productos con stock disponible."
              />
            )
          ) : (
            <ul className="flex flex-col gap-2">
              {variants.map((v) => {
                const inCart = isInCart(v.id);
                const isLast = v.stock_quantity === 1;
                return (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 p-3 rounded"
                    style={{ background: "var(--admin-bg)" }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="admin-table-thumb">
                        {v.product.images[0] ? (
                          <Image src={v.product.images[0]} alt="" width={40} height={40} />
                        ) : (
                          <Package className="h-5 w-5" style={{ color: "var(--admin-text-muted)" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-text)" }}>{v.product.name}</p>
                        <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                          {v.attribute_name}: {v.attribute_value} · Stock: {v.stock_quantity}
                          {v.price != null ? ` · ${formatGs(v.price)} Gs.` : ""}
                        </p>
                      </div>
                      {isLast && (
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded"
                          style={{ background: "var(--admin-warning-10)", color: "var(--admin-warning)" }}
                        >
                          Última unidad
                        </span>
                      )}
                    </div>

                    {inCart ? (
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded"
                        style={{ background: "var(--admin-muted-10)", color: "var(--admin-text-muted)" }}
                      >
                        En carrito
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => handleAdd(v)}
                      >
                        Agregar al carrito
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Coluna direita: carrinho */}
      <aside className="admin-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: "var(--admin-text)" }}>
            Carrito ({carrito.length} ítems)
          </h3>
          {carrito.length > 0 && (
            <span className="text-sm font-semibold" style={{ color: "var(--admin-accent)" }}>
              Total: {formatGs(totalCarritoPyg)} Gs.
            </span>
          )}
        </div>

        {carrito.length === 0 ? (
          <AdminEmptyState
            icon={Package}
            title="El carrito está vacío"
            description="Buscá y agregá productos para continuar."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {carrito.map((c) => (
              <li
                key={c.variantId}
                className="flex flex-col gap-2 p-3 rounded"
                style={{ background: "var(--admin-bg)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="admin-table-thumb">
                    {c.productImage ? (
                      <Image src={c.productImage} alt="" width={40} height={40} />
                    ) : (
                      <Package className="h-5 w-5" style={{ color: "var(--admin-text-muted)" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-text)" }}>{c.productName}</p>
                    <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {c.attributeValue} · {formatGs(c.precioPyg)} Gs.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-icon"
                    aria-label="Quitar del carrito"
                    onClick={() => handleRemove(c.variantId)}
                    style={{ color: "var(--admin-danger)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="admin-btn admin-btn-icon"
                      aria-label="Reducir cantidad"
                      onClick={() => handleDecrement(c.variantId)}
                      disabled={c.cantidad <= 1}
                      style={{ minHeight: "44px", minWidth: "44px" }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold" style={{ color: "var(--admin-text)", minWidth: "24px", textAlign: "center" }}>
                      {c.cantidad}
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-icon"
                      aria-label="Aumentar cantidad"
                      onClick={() => handleIncrement(c.variantId)}
                      disabled={c.cantidad >= c.stockMaximo}
                      style={{ minHeight: "44px", minWidth: "44px", opacity: c.cantidad >= c.stockMaximo ? 0.4 : 1 }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                    {formatGs(Math.round(c.precioPyg * c.cantidad))} Gs.
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
