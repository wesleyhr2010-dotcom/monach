"use client";

import { useState, useTransition } from "react";
import { criarVentaLoja } from "@/app/admin/actions-pdv";
import type { ClienteSeleccionado, CarritoItem, Moneda } from "./PdvClient";
import type { CotizacionAtual } from "@/app/admin/actions-cotizacion";

type Props = {
  cliente: ClienteSeleccionado;
  carrito: CarritoItem[];
  moneda: Moneda;
  cotizacionAtual: CotizacionAtual | null;
  onSuccess: (info: { ventaId: string; totalPyg: number; clienteLabel: string }) => void;
};

function formatGs(value: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0, useGrouping: true }).format(value);
}

function monedaLabel(m: Moneda): string {
  if (m === "PYG") return "Guaraní (Gs.)";
  if (m === "USD") return "Dólar (USD)";
  return "Real (BRL)";
}

export default function PdvStepResumen({ cliente, carrito, moneda, cotizacionAtual, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPyg = carrito.reduce((acc, c) => acc + Math.round(c.precioPyg * c.cantidad), 0);

  let totalConvertido: number = totalPyg;
  if (moneda !== "PYG" && cotizacionAtual) {
    const rate = moneda === "USD" ? cotizacionAtual.usdToPyg : cotizacionAtual.brlToPyg;
    if (rate > 0) totalConvertido = Math.round((totalPyg / rate) * 100) / 100;
  }

  const clienteLabel = cliente.tipo === "cliente" ? cliente.nombre : "Consumidor Final";

  function handleConfirm() {
    setError(null);

    if (carrito.length === 0) {
      setError("Agregá al menos un producto a la venta.");
      return;
    }
    if (moneda !== "PYG" && !cotizacionAtual) {
      setError("No hay cotización registrada. Configurá la cotización antes de registrar ventas.");
      return;
    }

    startTransition(async () => {
      const result = await criarVentaLoja({
        clienteId: cliente.tipo === "cliente" ? cliente.id : null,
        moneda,
        itens: carrito.map((c) => ({
          product_variant_id: c.variantId,
          cantidad: c.cantidad,
        })),
      });

      if (!result.success) {
        setError(result.error || "No se pudo registrar la venta. Intentá de nuevo o verificá el stock disponible.");
        return;
      }

      onSuccess({
        ventaId: result.data.id,
        totalPyg,
        clienteLabel,
      });
    });
  }

  return (
    <div className="admin-card">
      <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        Revisá la venta antes de confirmar
      </h2>

      {/* Cliente */}
      <section className="mb-4">
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--admin-text-muted)" }}>Cliente</p>
        <div className="p-3 rounded" style={{ background: "var(--admin-bg)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            {clienteLabel}
          </p>
          {cliente.tipo === "cliente" && (
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              RUC: {cliente.ruc ?? "—"}{cliente.ciudad ? ` · ${cliente.ciudad}` : ""}
            </p>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="mb-4">
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--admin-text-muted)" }}>Productos</p>
        <div className="admin-card" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((c) => (
                <tr key={c.variantId}>
                  <td>
                    <span style={{ color: "var(--admin-text)" }}>{c.productName}</span>
                    <br />
                    <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{c.attributeValue}</span>
                  </td>
                  <td>{c.cantidad}</td>
                  <td>{formatGs(c.precioPyg)} Gs.</td>
                  <td>{formatGs(Math.round(c.precioPyg * c.cantidad))} Gs.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Moneda */}
      <section className="mb-4">
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--admin-text-muted)" }}>Moneda de pago</p>
        <p className="text-sm" style={{ color: "var(--admin-text)" }}>{monedaLabel(moneda)}</p>
      </section>

      {/* Total */}
      <div
        className="flex items-center justify-between p-4 rounded"
        style={{ background: "var(--admin-bg)", borderTop: "1px solid var(--admin-border)" }}
      >
        <span className="text-sm" style={{ color: "var(--admin-text)" }}>Total</span>
        <span className="text-base font-semibold" style={{ color: "var(--admin-accent)" }}>
          {moneda === "PYG"
            ? `${formatGs(totalConvertido)} Gs.`
            : `${totalConvertido.toFixed(2)} ${moneda}`}
        </span>
      </div>

      {/* Aviso */}
      <div className="admin-alert admin-alert-warning mt-4">
        Al confirmar, el stock de los productos seleccionados se actualizará automáticamente.
      </div>

      {/* Erro */}
      {error && <div className="admin-alert admin-alert-error mt-3">{error}</div>}

      {/* Confirmar */}
      <button
        type="button"
        className="admin-btn admin-btn-primary mt-6 w-full sm:w-auto"
        onClick={handleConfirm}
        disabled={isPending}
        style={{ background: "var(--admin-success)", color: "var(--admin-bg)" }}
      >
        {isPending ? "Procesando..." : "Confirmar venta"}
      </button>
    </div>
  );
}
