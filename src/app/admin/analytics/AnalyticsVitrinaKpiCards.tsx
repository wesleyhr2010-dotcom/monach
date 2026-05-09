import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { Eye, Users, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";

type Props = {
  kpis: {
    totalVisitas: number;
    visitantesUnicos: number;
    cliquesWhatsApp: number;
    ctrCheckout: number;
    ctrContato: number;
  };
};

export function AnalyticsVitrinaKpiCards({ kpis }: Props) {
  return (
    <>
      <MetricCard
        label="Visitas a Vitrinas"
        value={String(kpis.totalVisitas)}
        icon={<Eye size={15} color="var(--admin-info-light)" strokeWidth={1.5} />}
        iconBg="rgba(96, 165, 250, 0.1)"
        iconColor="#60A5FA"
      />
      <MetricCard
        label="Visitantes Únicos"
        value={String(kpis.visitantesUnicos)}
        icon={<Users size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
        iconBg="rgba(53, 96, 90, 0.1)"
        iconColor="#35605A"
      />
      <MetricCard
        label="Cliques WhatsApp"
        value={String(kpis.cliquesWhatsApp)}
        icon={<MousePointerClick size={15} color="var(--admin-success)" strokeWidth={1.5} />}
        iconBg="rgba(74, 222, 128, 0.1)"
        iconColor="#4ADE80"
      />
      <MetricCard
        label="CTR Checkout"
        value={`${kpis.ctrCheckout}%`}
        icon={<ShoppingCart size={15} color="var(--admin-warning)" strokeWidth={1.5} />}
        iconBg="rgba(250, 204, 21, 0.1)"
        iconColor="#FACC15"
      />
      <MetricCard
        label="CTR Contato"
        value={`${kpis.ctrContato}%`}
        icon={<TrendingUp size={15} color="var(--admin-beige)" strokeWidth={1.5} />}
        iconBg="rgba(180, 171, 162, 0.1)"
        iconColor="#B4ABA2"
      />
    </>
  );
}
