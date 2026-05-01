import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getDashboardCompleto } from "./actions-revendedora";
import { AppHeader } from "@/components/app/AppHeader";
import { SectionHeader } from "@/components/app/SectionHeader";
import { StatCard } from "@/components/app/StatCard";
import { MaletaCard } from "@/components/app/MaletaCard";

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

export default async function AppDashboardPage() {
  const user = await getCurrentUser();

  if (user?.profileId) {
    const reseller = await prisma.reseller.findUnique({
      where: { id: user.profileId },
      select: {
        onboarding_completo: true,
        _count: { select: { maletas: true } },
      },
    });

    const isPrimeiroAcesso =
      reseller &&
      !reseller.onboarding_completo &&
      reseller._count.maletas === 0;

    if (isPrimeiroAcesso) {
      redirect("/app/bienvenida");
    }
  }

  // Busca dados no servidor diretamente — sem segundo round-trip via useEffect
  const data = await getDashboardCompleto();

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
