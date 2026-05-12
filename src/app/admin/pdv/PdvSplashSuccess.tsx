"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

type Props = {
  ventaId: string;
  totalPyg: number;
  clienteLabel: string;
  onNuevaVenta: () => void;
};

function formatGs(value: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0, useGrouping: true }).format(value);
}

export default function PdvSplashSuccess({ ventaId, totalPyg, clienteLabel, onNuevaVenta }: Props) {
  return (
    <div
      className="admin-card flex flex-col items-center text-center p-8"
      style={{ background: "var(--admin-success-10)", border: "1px solid var(--admin-success)" }}
    >
      <CheckCircle style={{ color: "var(--admin-success)", width: "64px", height: "64px" }} />

      <h2 className="text-2xl font-semibold mt-6" style={{ color: "var(--admin-text)" }}>
        ¡Venta registrada!
      </h2>
      <p className="text-sm mt-2" style={{ color: "var(--admin-text-muted)" }}>
        La venta fue guardada correctamente.
      </p>

      <div className="mt-6 flex flex-col gap-1">
        <p className="text-sm" style={{ color: "var(--admin-text)" }}>
          Total: {formatGs(totalPyg)} Gs.
        </p>
        <p className="text-sm" style={{ color: "var(--admin-text)" }}>
          Cliente: {clienteLabel}
        </p>
      </div>

      <div className="flex gap-3 mt-8">
        <button type="button" className="admin-btn admin-btn-primary" onClick={onNuevaVenta}>
          Nueva venta
        </button>
        <Link href={`/admin/ventas/${ventaId}`} className="admin-btn admin-btn-secondary">
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
