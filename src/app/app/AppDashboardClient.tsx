"use client";

import { useState, useEffect } from "react";
import { getDashboardCompleto } from "./actions-revendedora";
import { AppHeader } from "@/components/app/AppHeader";
import { SectionHeader } from "@/components/app/SectionHeader";
import { StatCard } from "@/components/app/StatCard";
import { MaletaCard } from "@/components/app/MaletaCard";

type DashboardData = Awaited<ReturnType<typeof getDashboardCompleto>>;

function formatCurrency(value: number): string {
  return `G$ ${value.toLocaleString("es-PY")}`;
}

const ReceiptIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <path d="M16 8H8" /><path d="M16 12H8" /><path d="M12 16H8" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const PackageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

const AwardIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export default function AppDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardCompleto()
      .then((result) => { setData(result); setLoading(false); })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar datos.");
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
          <button
            onClick={() => {
              setError(""); setLoading(true);
              getDashboardCompleto()
                .then(r => { setData(r); setLoading(false); })
                .catch(() => { setError("Error al cargar datos."); setLoading(false); });
            }}
            className="text-sm text-[#35605A] font-medium hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-[3px] animate-spin"
            style={{ borderColor: "#EBEBEB", borderTopColor: "#35605A" }}
          />
          <p className="text-[#777777] text-sm" style={{ fontFamily: "var(--font-raleway)" }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  const maletaAtual =
    data.historicoMaletas.find((m) => m.status === "ativa") ??
    data.historicoMaletas[0] ??
    null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <AppHeader name={data.nome} nivel={data.nivel} notificacoes={0} />

      {/* Análisis */}
      <section className="px-5 py-4">
        <SectionHeader title="Análisis" href="/app/desempenho" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<ReceiptIcon />} label="Facturado" value={formatCurrency(data.totalVendido)} />
          <StatCard icon={<TrendingUpIcon />} label="Mi Ganancia" value={formatCurrency(data.comissaoValor)} />
          <StatCard icon={<PackageIcon />} label="Pzas. vendidas" value={data.totalPecas} />
          <StatCard icon={<AwardIcon />} label="Puntos" value={data.xpTotal} />
        </div>
      </section>

      {/* Mis Consignaciones */}
      <section className="px-5 py-4">
        <SectionHeader title="Mis Consignaciones" href="/app/maleta" />
        <MaletaCard maleta={maletaAtual} totalVendido={data.totalVendido} />
      </section>
    </div>
  );
}
