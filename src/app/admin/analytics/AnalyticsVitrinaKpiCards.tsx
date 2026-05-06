"use client";

import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Eye, Users, MousePointerClick, TrendingUp, ShoppingCart } from "lucide-react";

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
      <AdminStatCard label="Visitas a Vitrinas" value={kpis.totalVisitas} icon={Eye} color="info" />
      <AdminStatCard label="Visitantes Únicos" value={kpis.visitantesUnicos} icon={Users} color="default" />
      <AdminStatCard label="Cliques WhatsApp" value={kpis.cliquesWhatsApp} icon={MousePointerClick} color="success" />
      <AdminStatCard label="CTR Checkout" value={`${kpis.ctrCheckout}%`} icon={ShoppingCart} color="warning" />
      <AdminStatCard label="CTR Contato" value={`${kpis.ctrContato}%`} icon={TrendingUp} color="danger" />
    </>
  );
}
