"use client";

import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  Briefcase,
  PackageCheck,
  AlertTriangle,
  DollarSign,
  Users,
  Clock,
} from "lucide-react";

type AnalyticsKpiCardsProps = {
  kpis: {
    maletasAtivas: number;
    devolvidasMes: number;
    taxaAtraso: number;
    ticketMedio: number;
    revendedorasComMaleta: number;
    tempoMedioDevolucaoDias: number;
  };
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(1)}K`;
  return `G$ ${value.toFixed(0)}`;
}

export function AnalyticsKpiCards({ kpis }: AnalyticsKpiCardsProps) {
  return (
    <>
      <AdminStatCard label="Maletas Ativas" value={kpis.maletasAtivas} icon={Briefcase} color="info" />
      <AdminStatCard label="Devolvidas (mes)" value={kpis.devolvidasMes} icon={PackageCheck} color="success" />
      <AdminStatCard label="Taxa de Atraso" value={`${kpis.taxaAtraso}%`} icon={AlertTriangle} color="danger" />
      <AdminStatCard label="Ticket Medio" value={formatCurrency(kpis.ticketMedio)} icon={DollarSign} color="default" />
      <AdminStatCard label="Rev. con Maleta" value={kpis.revendedorasComMaleta} icon={Users} color="default" />
      <AdminStatCard label="Tempo Medio Dev." value={`${kpis.tempoMedioDevolucaoDias} d`} icon={Clock} color="warning" />
    </>
  );
}
