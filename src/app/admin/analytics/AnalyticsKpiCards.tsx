import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import {
  Briefcase,
  PackageCheck,
  AlertTriangle,
  CircleDollarSign,
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
      <MetricCard
        label="Maletas Ativas"
        value={String(kpis.maletasAtivas)}
        icon={<Briefcase size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
        iconBg="rgba(53, 96, 90, 0.1)"
        iconColor="#35605A"
      />
      <MetricCard
        label="Devolvidas (mes)"
        value={String(kpis.devolvidasMes)}
        icon={<PackageCheck size={15} color="var(--admin-success)" strokeWidth={1.5} />}
        iconBg="rgba(74, 222, 128, 0.1)"
        iconColor="#4ADE80"
      />
      <MetricCard
        label="Taxa de Atraso"
        value={`${kpis.taxaAtraso}%`}
        icon={<AlertTriangle size={15} color="var(--admin-danger)" strokeWidth={1.5} />}
        iconBg="rgba(224, 92, 92, 0.1)"
        iconColor="#E05C5C"
      />
      <MetricCard
        label="Ticket Medio"
        value={formatCurrency(kpis.ticketMedio)}
        icon={<CircleDollarSign size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
        iconBg="rgba(53, 96, 90, 0.1)"
        iconColor="#35605A"
      />
      <MetricCard
        label="Rev. con Maleta"
        value={String(kpis.revendedorasComMaleta)}
        icon={<Users size={15} color="var(--admin-beige)" strokeWidth={1.5} />}
        iconBg="rgba(180, 171, 162, 0.1)"
        iconColor="#B4ABA2"
      />
      <MetricCard
        label="Tempo Medio Dev."
        value={`${kpis.tempoMedioDevolucaoDias} d`}
        icon={<Clock size={15} color="var(--admin-brown)" strokeWidth={1.5} />}
        iconBg="rgba(145, 121, 97, 0.1)"
        iconColor="#917961"
      />
    </>
  );
}
