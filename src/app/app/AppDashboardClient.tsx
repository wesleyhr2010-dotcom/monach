"use client";

import { useState, useEffect } from "react";
import { getDashboardCompleto } from "./actions-revendedora";
import { AppHeader } from "@/components/app/AppHeader";
import { SectionHeader } from "@/components/app/SectionHeader";
import { StatCard } from "@/components/app/StatCard";
import { MaletaCard } from "@/components/app/MaletaCard";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";

type DashboardData = {
  nome: string;
  avatarUrl: string | null;
  rank: { nome: string; cor: string };
  pontosSaldo: number;
  faturamentoMes: number;
  ganhosMes: number;
  pecasVendidasMes: number;
  maletaAtiva: { id: string; status: string; data_limite: Date | null } | null;
  historicoMaletas: Array<{ id: string; status: string; data_limite: Date | null; totalItens: number; vendidos: number }>;
  commissionInfo: {
    tierAtual: { pct: number; min_sales_value: number } | null;
    proximoTier: { pct: number; min_sales_value: number } | null;
    tiers: Array<{ pct: number; min_sales_value: number }>;
    faltaParaProximo: number;
  };
};

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
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar datos.");
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#F5F2EF]">
        <ErrorState
          title="Error al cargar"
          description={error}
          onRetry={() => {
            setError(""); setLoading(true);
            getDashboardCompleto()
              .then((r) => {
                if (r.success) { setData(r.data); }
                else { setError(r.error); }
                setLoading(false);
              })
              .catch(() => { setError("Error al cargar datos."); setLoading(false); });
          }}
        />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="absolute inset-0 flex flex-col gap-3 p-5 bg-[#F5F2EF]">
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const maletaAtual =
    data.historicoMaletas.find((m) => m.status === "ativa" || m.status === "atrasada") ??
    data.historicoMaletas[0] ??
    null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <AppHeader
        name={data.nome}
        avatarUrl={data.avatarUrl}
        rank={data.rank}
        pontos={data.pontosSaldo}
        notificacoes={0}
      />

      {/* Análisis */}
      <section className="px-5 py-4">
        <SectionHeader title="Análisis" href="/app/desempenho" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<ReceiptIcon />} label="Facturado" value={formatCurrency(data.faturamentoMes)} />
          <StatCard icon={<TrendingUpIcon />} label="Mi Ganancia" value={formatCurrency(data.ganhosMes)} />
          <StatCard icon={<PackageIcon />} label="Pzas. vendidas" value={data.pecasVendidasMes} />
          <StatCard icon={<AwardIcon />} label="Puntos" value={data.pontosSaldo} />
        </div>
      </section>

      {/* Mis Consignaciones */}
      <section className="px-5 py-4">
        <SectionHeader title="Mis Consignaciones" href="/app/maleta" />
        <MaletaCard
          maleta={data.maletaAtiva ?? maletaAtual}
          tiers={data.commissionInfo.tiers}
          commissionInfo={data.commissionInfo}
        />
      </section>
    </div>
  );
}
