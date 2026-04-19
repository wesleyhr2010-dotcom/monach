import { requireAuth } from "@/lib/user";
import { redirect } from "next/navigation";
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

function formatCurrency(value: number): string {
    if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1).replace(".", ".")}M`;
    if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(0)}K`;
    return `G$ ${value.toLocaleString("pt-BR")}`;
}

export default async function AdminDashboardPage() {
    const user = await requireAuth(["ADMIN", "COLABORADORA"]);
    if (!user) redirect("/admin/login");

    const isSuperAdmin = user.role === "ADMIN";
    const colaboradoraId = isSuperAdmin ? undefined : (user.profileId ?? undefined);

    const [metricas, alertas, ranking, minhaComissao] = await Promise.all([
        getDashboardMetricas(colaboradoraId),
        getAlertasMaletas(colaboradoraId),
        isSuperAdmin
            ? getRankingColaboradoras()
            : colaboradoraId
                ? getRankingRevendedoras(colaboradoraId)
                : Promise.resolve([]),
        !isSuperAdmin && colaboradoraId
            ? getMinhaComissao(colaboradoraId)
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
                borderBottom: "1px solid #1A1A1A",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ color: "#444", fontFamily: "Raleway, sans-serif", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                        Admin / Dashboard
                    </span>
                    <span style={{ color: "#EDEDED", fontFamily: "'Playfair Display', serif", fontSize: 20, lineHeight: "24px", fontWeight: 600 }}>
                        {isSuperAdmin ? "Dashboard" : `Olá, ${user.name.split(" ")[0]}`}
                    </span>
                </div>
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#1C3A35",
                        border: "1px solid #35605A55",
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

            {/* Body */}
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* KPI Row */}
                <div style={{ display: "flex", gap: 16 }}>
                    <MetricCard
                        label="Faturamento"
                        value={formatCurrency(metricas.faturamento)}
                        iconBg="#35605A18"
                        iconColor="#35605A"
                        icon={<CircleDollarSign size={15} color="#35605A" strokeWidth={1.5} />}
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
                            icon={<TrendingUp size={15} color="#35605A" strokeWidth={1.5} />}
                            subValue={{ type: "neutral", text: "10% sobre grupo" }}
                        />
                    )}

                    <MetricCard
                        label="Maletas"
                        value={`${metricas.maletasAtivas} ativas`}
                        iconBg="#9179611A"
                        iconColor="#917961"
                        icon={<Briefcase size={15} color="#917961" strokeWidth={1.5} />}
                        subValue={metricas.maletasAtrasadas > 0 ? {
                            type: "down",
                            text: `${metricas.maletasAtrasadas} atrasada${metricas.maletasAtrasadas > 1 ? "s" : ""}`,
                        } : undefined}
                    />

                    <MetricCard
                        label="Revendedoras"
                        value={`${metricas.revendedorasAtivas} ativas`}
                        iconBg="#B4ABA214"
                        iconColor="#B4ABA2"
                        icon={<Users size={15} color="#B4ABA2" strokeWidth={1.5} />}
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
                        icon={<TriangleAlert size={15} color="#E05C5C" strokeWidth={1.5} />}
                        variant="danger"
                        valueColor="#E05C5C"
                    />
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
