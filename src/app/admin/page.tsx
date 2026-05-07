import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    getDashboardMetricas,
    getAlertasMaletas,
    getRankingColaboradoras,
    getRankingRevendedoras,
    getMinhaComissao,
} from "./actions-dashboard";
import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { AlertasCard } from "@/components/admin/dashboard/AlertasCard";
import { RankingTable } from "@/components/admin/dashboard/RankingTable";
import { DocsCard } from "@/components/admin/dashboard/DocsCard";
import {
    Bell,
    Briefcase,
    CircleDollarSign,
    TriangleAlert,
    TrendingUp,
    Users,
} from "lucide-react";

export const metadata = {
    title: "Dashboard — Monarca Admin",
};

const PERIOD_OPTIONS = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "3m", days: 90 },
    { label: "12m", days: 365 },
];

function formatCurrency(value: number): string {
    if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1).replace(".", ".")}M`;
    if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(0)}K`;
    return `G$ ${value.toLocaleString("pt-BR")}`;
}

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || !user.isActive || (user.role !== "ADMIN" && user.role !== "COLABORADORA")) {
        redirect("/admin/login");
    }

    const params = await searchParams;
    const periodParam = params.period || "30";
    const periodDays = parseInt(periodParam, 10);
    const validPeriod = PERIOD_OPTIONS.some((o) => o.days === periodDays) ? periodDays : 30;

    const isSuperAdmin = user.role === "ADMIN";
    const colaboradoraId = isSuperAdmin ? undefined : (user.profileId ?? undefined);

    const [metricas, alertas, ranking, minhaComissao] = await Promise.all([
        getDashboardMetricas(colaboradoraId, validPeriod),
        getAlertasMaletas(colaboradoraId),
        isSuperAdmin
            ? getRankingColaboradoras(validPeriod)
            : colaboradoraId
                ? getRankingRevendedoras(colaboradoraId, validPeriod)
                : Promise.resolve([]),
        !isSuperAdmin && colaboradoraId
            ? getMinhaComissao(colaboradoraId, validPeriod)
            : Promise.resolve(null),
    ]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 60,
                paddingInline: 32,
                borderBottom: "1px solid var(--admin-border)",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, sans-serif", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                        Admin / Dashboard
                    </span>
                    <span style={{ color: "var(--admin-text)", fontFamily: "'Playfair Display', serif", fontSize: 20, lineHeight: "24px", fontWeight: 600 }}>
                        {isSuperAdmin ? "Dashboard" : `Olá, ${user.name.split(" ")[0]}`}
                    </span>
                </div>
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "var(--admin-accent-hover)",
                        border: "1px solid var(--admin-border-focus)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Bell size={15} color="var(--admin-success)" strokeWidth={1.5} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <div style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "var(--admin-danger)",
                            border: "1.5px solid var(--admin-bg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Bell size={15} color="#4ADE80" strokeWidth={1.5} />
                        </div>
                        {metricas.totalAlertas > 0 && (
                            <div style={{
                                position: "absolute",
                                top: -4,
                                right: -4,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#E05C5C",
                                border: "1.5px solid #0A0A0A",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <span style={{ color: "#fff", fontFamily: "Raleway, sans-serif", fontWeight: 700, fontSize: 9 }}>
                                    {Math.min(metricas.totalAlertas, 9)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* KPI Row */}
                <div style={{ display: "flex", gap: 16 }}>
                    <MetricCard
                        label="Faturamento"
                        value={formatCurrency(metricas.faturamento)}
                        iconBg="#35605A18"
                        iconColor="#35605A"
                        icon={<CircleDollarSign size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
                        subValue={metricas.faturamentoVariacao !== 0 ? {
                            type: metricas.faturamentoVariacao > 0 ? "up" : "down",
                            text: `${metricas.faturamentoVariacao > 0 ? "+" : ""}${metricas.faturamentoVariacao}%`,
                        } : undefined}
                    />

                    {!isSuperAdmin && minhaComissao !== null && (
                        <MetricCard
                            label="Minha Comissão"
                            value={formatCurrency(minhaComissao)}
                            iconBg="#35605A18"
                            iconColor="#35605A"
                            icon={<TrendingUp size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
                            subValue={{ type: "neutral", text: "10% sobre grupo" }}
                        />
                    )}

                    <MetricCard
                        label="Maletas"
                        value={`${metricas.maletasAtivas} ativas`}
                        iconBg="var(--admin-brown)1A"
                        iconColor="var(--admin-brown)"
                        icon={<Briefcase size={15} color="var(--admin-brown)" strokeWidth={1.5} />}
                        subValue={metricas.maletasAtrasadas > 0 ? {
                            type: "down",
                            text: `${metricas.maletasAtrasadas} atrasada${metricas.maletasAtrasadas > 1 ? "s" : ""}`,
                        } : undefined}
                    />

                    <MetricCard
                        label="Revendedoras"
                        value={`${metricas.revendedorasAtivas} ativas`}
                        iconBg="var(--admin-beige)14"
                        iconColor="var(--admin-beige)"
                        icon={<Users size={15} color="var(--admin-beige)" strokeWidth={1.5} />}
                        subValue={metricas.revendedorasNovas > 0 ? {
                            type: "up",
                            text: `+${metricas.revendedorasNovas} novas`,
                        } : undefined}
                    />

                    <MetricCard
                        label="Atenção"
                        value={String(metricas.totalAlertas)}
                        iconBg="#E05C5C1A"
                        iconColor="#E05C5C"
                        icon={<TriangleAlert size={15} color="var(--admin-danger)" strokeWidth={1.5} />}
                        variant="danger"
                        valueColor="var(--admin-danger)"
                    />
                </div>

                {/* Analytics link */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link
                        href={`/admin/analytics?period=${validPeriod}`}
                        style={{
                            color: "#35605A",
                            fontFamily: "Raleway, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        Ver analytics detallado →
                    </Link>
                </div>

                {/* Middle Row: Alertas + Ranking */}
                <div style={{ display: "flex", gap: 16 }}>
                    <AlertasCard items={alertas} />
                    <RankingTable
                        title={isSuperAdmin ? "Desempenho por Consultora" : "Ranking das Minhas Revendedoras"}
                        items={ranking}
                    />
                </div>

                {/* Docs Card */}
                <DocsCard
                    count={0}
                    nomes={[]}
                    href="/admin/revendedoras"
                />
            </div>
        </div>
    );
}
