"use client";

import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { CircleDollarSign, ShoppingCart, Receipt, Package } from "lucide-react";
import type { VentasKPIs } from "@/app/admin/actions-ventas";

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(1)}K`;
  return `G$ ${value.toFixed(0)}`;
}

export function VentasKpiCards({ kpis }: { kpis: VentasKPIs }) {
  return (
    <>
      <MetricCard
        label="Total Vendido"
        value={formatCurrency(kpis.totalVendidoPyg)}
        icon={<CircleDollarSign size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
        iconBg="rgba(53, 96, 90, 0.1)"
        iconColor="#35605A"
      />
      <MetricCard
        label="Cantidad de Ventas"
        value={String(kpis.quantidadeVentas)}
        icon={<ShoppingCart size={15} color="var(--admin-success)" strokeWidth={1.5} />}
        iconBg="rgba(74, 222, 128, 0.1)"
        iconColor="#4ADE80"
      />
      <MetricCard
        label="Ticket Medio"
        value={formatCurrency(kpis.ticketMedioPyg)}
        icon={<Receipt size={15} color="var(--admin-beige)" strokeWidth={1.5} />}
        iconBg="rgba(180, 171, 162, 0.1)"
        iconColor="#B4ABA2"
      />
      <MetricCard
        label="Total Items Vendidos"
        value={String(kpis.totalItensVendidos)}
        icon={<Package size={15} color="var(--admin-brown)" strokeWidth={1.5} />}
        iconBg="rgba(145, 121, 97, 0.1)"
        iconColor="#917961"
      />
    </>
  );
}
