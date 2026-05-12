"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { salvarCotizacion, type CotizacionAtual, type CotizacionHistorialItem } from "@/app/admin/actions-cotizacion";

type Props = {
  cotizacionAtual: CotizacionAtual | null;
  historial: CotizacionHistorialItem[];
};

const TZ = "America/Asuncion";

function formatGs(value: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0, useGrouping: true }).format(value);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("es-PY", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("es-PY", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} a las ${timePart}`;
}

export default function CotizacionClient({ cotizacionAtual, historial }: Props) {
  const router = useRouter();
  const [brl, setBrl] = useState<string>(cotizacionAtual ? String(cotizacionAtual.brlToPyg) : "");
  const [usd, setUsd] = useState<string>(cotizacionAtual ? String(cotizacionAtual.usdToPyg) : "");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const brlNum = Number(brl);
    const usdNum = Number(usd);
    if (!Number.isFinite(brlNum) || brlNum <= 0) {
      setFeedback({ kind: "error", message: "Ingresá un valor válido para BRL." });
      return;
    }
    if (!Number.isFinite(usdNum) || usdNum <= 0) {
      setFeedback({ kind: "error", message: "Ingresá un valor válido para USD." });
      return;
    }

    startTransition(async () => {
      const result = await salvarCotizacion(brlNum, usdNum);
      if (result.success) {
        setFeedback({ kind: "success", message: "Cotización guardada correctamente." });
        router.refresh();
      } else {
        setFeedback({
          kind: "error",
          message: result.error || "No se pudo guardar la cotización. Verificá los valores e intentá de nuevo.",
        });
      }
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Cotización del Día"
        description="Ingresá las tasas de cambio vigentes. Cada guardado crea un nuevo registro — no se sobreescribe el historial."
        breadcrumb="Configuración"
      />

      <div className="admin-content">
        {/* Formulário */}
        <div className="admin-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label htmlFor="cot-brl" className="text-sm" style={{ color: "var(--admin-text)" }}>
                1 Real (BRL) =
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="cot-brl"
                  type="number"
                  className="admin-input"
                  value={brl}
                  onChange={(e) => setBrl(e.target.value)}
                  placeholder="Ej: 1400"
                  min="1"
                  step="0.01"
                  disabled={isPending}
                  required
                />
                <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>Gs.</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label htmlFor="cot-usd" className="text-sm" style={{ color: "var(--admin-text)" }}>
                1 Dólar (USD) =
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="cot-usd"
                  type="number"
                  className="admin-input"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                  placeholder="Ej: 7500"
                  min="1"
                  step="0.01"
                  disabled={isPending}
                  required
                />
                <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>Gs.</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar cotización"}
              </button>

              {cotizacionAtual && (
                <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Última actualización: {formatTimestamp(cotizacionAtual.createdAt)}
                </span>
              )}
            </div>

            {feedback && (
              <div
                className={feedback.kind === "success" ? "admin-alert admin-alert-success" : "admin-alert admin-alert-error"}
                role="status"
                aria-live="polite"
              >
                {feedback.message}
              </div>
            )}
          </form>
        </div>

        {/* Histórico */}
        <section className="mt-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
            Historial de cotizaciones
          </h2>

          {historial.length === 0 ? (
            <AdminEmptyState
              icon={Calendar}
              title="Sin registros anteriores."
              description="Todavía no hay cotizaciones registradas. Ingresá los valores actuales para empezar."
            />
          ) : (
            <div className="admin-card" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha / hora</th>
                    <th>BRL → Gs.</th>
                    <th>USD → Gs.</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTimestamp(row.createdAt)}</td>
                      <td>{formatGs(row.brlToPyg)}</td>
                      <td>{formatGs(row.usdToPyg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
