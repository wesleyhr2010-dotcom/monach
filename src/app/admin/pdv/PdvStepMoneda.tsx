"use client";

import type { CarritoItem, Moneda } from "./PdvClient";
import type { CotizacionAtual } from "@/app/admin/actions-cotizacion";

type Props = {
  carrito: CarritoItem[];
  moneda: Moneda;
  setMoneda: (m: Moneda) => void;
  cotizacionAtual: CotizacionAtual | null;
};

const TZ = "America/Asuncion";

function formatGs(value: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0, useGrouping: true }).format(value);
}

function formatCotizacionDate(iso: string): string {
  const date = new Date(iso);
  const dd = new Intl.DateTimeFormat("es-PY", { timeZone: TZ, day: "2-digit" }).format(date);
  const mm = new Intl.DateTimeFormat("es-PY", { timeZone: TZ, month: "2-digit" }).format(date);
  const time = new Intl.DateTimeFormat("es-PY", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${dd}/${mm} ${time}`;
}

const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "PYG", label: "Guaraní (Gs.)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "BRL", label: "Real (BRL)" },
];

export default function PdvStepMoneda({ carrito, moneda, setMoneda, cotizacionAtual }: Props) {
  const totalPyg = carrito.reduce((acc, c) => acc + Math.round(c.precioPyg * c.cantidad), 0);

  let totalConvertido: number | null = totalPyg;
  if (moneda !== "PYG") {
    if (!cotizacionAtual) {
      totalConvertido = null;
    } else {
      const rate = moneda === "USD" ? cotizacionAtual.usdToPyg : cotizacionAtual.brlToPyg;
      totalConvertido = rate > 0 ? Math.round((totalPyg / rate) * 100) / 100 : null;
    }
  }

  return (
    <div className="admin-card">
      <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        ¿En qué moneda se paga?
      </h2>

      {/* Radio cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Moneda">
        {MONEDAS.map((m) => {
          const selected = moneda === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMoneda(m.value)}
              className="p-4 rounded text-left"
              style={{
                background: "var(--admin-surface)",
                border: `1px solid ${selected ? "var(--admin-accent)" : "var(--admin-border)"}`,
                color: "var(--admin-text)",
              }}
            >
              <span className="text-sm font-semibold">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Display de cotização */}
      <div className="mt-6 p-4 rounded" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
        {cotizacionAtual ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              1 USD = {formatGs(cotizacionAtual.usdToPyg)} Gs. · Actualizado {formatCotizacionDate(cotizacionAtual.createdAt)}
            </p>
            <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
              1 BRL = {formatGs(cotizacionAtual.brlToPyg)} Gs.
            </p>
          </div>
        ) : (
          <div className="admin-alert admin-alert-warning">
            Sin cotización registrada hoy. Pedile al admin que la actualice.
          </div>
        )}
      </div>

      {/* Total estimado */}
      <div className="mt-6">
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          {moneda === "PYG" ? "Total estimado en Gs." : `Total estimado en ${moneda}`}
        </p>
        <p className="text-2xl font-semibold mt-1" style={{ color: "var(--admin-text)" }}>
          {totalConvertido != null
            ? moneda === "PYG"
              ? `${formatGs(totalConvertido)} Gs.`
              : `${totalConvertido.toFixed(2)} ${moneda}`
            : "—"}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--admin-text-muted)" }}>
          Los precios del sistema están en Gs. Esta cotización es orientativa.
        </p>
      </div>
    </div>
  );
}
