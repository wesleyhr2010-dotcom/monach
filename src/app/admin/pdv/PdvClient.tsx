"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStepIndicator } from "@/components/admin/AdminStepIndicator";
import type { CotizacionAtual } from "@/app/admin/actions-cotizacion";
import PdvStepCliente from "./PdvStepCliente";
import PdvStepProductos from "./PdvStepProductos";

export type ClienteSeleccionado =
  | { tipo: "cliente"; id: string; nombre: string; ruc: string | null; ciudad: string | null }
  | { tipo: "consumidor_final" };

export type CarritoItem = {
  variantId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  attributeName: string;
  attributeValue: string;
  precioPyg: number;
  cantidad: number;
  stockMaximo: number;
};

export type Moneda = "PYG" | "USD" | "BRL";

const PDV_STEPS = [
  { label: "Cliente" },
  { label: "Productos" },
  { label: "Moneda" },
  { label: "Resumen" },
];

type Props = {
  cotizacionAtual: CotizacionAtual | null;
  categorias: Array<{ id: string; name: string }>;
};

export default function PdvClient({ cotizacionAtual, categorias }: Props) {
  const [step, setStep] = useState<number>(0);
  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [moneda, setMoneda] = useState<Moneda>("PYG");
  const [showSplash, setShowSplash] = useState<{ ventaId: string; totalPyg: number; clienteLabel: string } | null>(null);

  function canAdvance(): boolean {
    if (step === 0) return cliente !== null;
    if (step === 1) return carrito.length > 0;
    if (step === 2) return cotizacionAtual !== null || moneda === "PYG";
    return true;
  }

  function handleNext() {
    if (!canAdvance()) return;
    setStep((s) => Math.min(s + 1, PDV_STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function resetPdv() {
    setStep(0);
    setCliente(null);
    setCarrito([]);
    setMoneda("PYG");
    setShowSplash(null);
  }

  return (
    <>
      <AdminPageHeader
        title="Punto de Venta"
        description="Registrá una venta en la tienda física."
        breadcrumb="Ventas"
      />

      <div className="admin-content">
        {showSplash ? (
          <PlaceholderSplash splash={showSplash} onReset={resetPdv} />
        ) : (
          <>
            <AdminStepIndicator steps={PDV_STEPS} currentStep={step} />

            <div className="mt-8">
              {step === 0 && (
                <PdvStepCliente
                  cliente={cliente}
                  onSelect={setCliente}
                />
              )}
              {step === 1 && (
                <PdvStepProductos
                  carrito={carrito}
                  setCarrito={setCarrito}
                  categorias={categorias}
                />
              )}
              {step === 2 && (
                <PlaceholderStep label="Step 3 — Moneda (a ser implementado em 17-04)" />
              )}
              {step === 3 && (
                <PlaceholderStep label="Step 4 — Resumen (a ser implementado em 17-04)" />
              )}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleBack}
                disabled={step === 0}
              >
                ← Anterior
              </button>

              {step < PDV_STEPS.length - 1 && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                >
                  Siguiente →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function PlaceholderStep({ label }: { label: string }) {
  return (
    <div className="admin-card">
      <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{label}</p>
    </div>
  );
}

function PlaceholderSplash({ splash, onReset }: { splash: { ventaId: string; totalPyg: number; clienteLabel: string }; onReset: () => void }) {
  return (
    <div className="admin-card">
      <p className="text-base" style={{ color: "var(--admin-text)" }}>¡Venta registrada! ({splash.ventaId.slice(0, 8)})</p>
      <button type="button" className="admin-btn admin-btn-primary mt-4" onClick={onReset}>
        Nueva venta
      </button>
    </div>
  );
}
