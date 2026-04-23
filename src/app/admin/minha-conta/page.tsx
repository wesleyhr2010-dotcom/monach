import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getMinhaConta } from "./actions";
import { formatGs, formatPct } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import {
    CircleDollarSign,
    Briefcase,
    Users,
    ArrowRight,
    TrendingUp,
    Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== "COLABORADORA") {
        redirect("/admin");
    }

    const { perfil, resumo } = await getMinhaConta();

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Minha Conta"
                description="Resumo do seu grupo e comissões"
            />

            {/* Perfil */}
            <div className="admin-card" style={{ marginTop: 24 }}>
                <div className="flex items-center gap-4">
                    <AdminAvatar src={perfil.avatar_url} name={perfil.name} size="lg" />
                    <div className="flex-1">
                        <h2
                            className="text-lg font-semibold"
                            style={{ fontFamily: "'Playfair Display', system-ui, sans-serif" }}
                        >
                            {perfil.name}
                        </h2>
                        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                            {perfil.email}
                        </p>
                        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                            WhatsApp: {perfil.whatsapp}
                        </p>
                    </div>
                    <div className="text-right">
                        <div
                            className="text-sm font-semibold"
                            style={{ color: "var(--admin-primary)" }}
                        >
                            Taxa de Comissão: {formatPct(perfil.taxa_comissao)}
                        </div>
                        <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
                            Definida pelo administrador
                        </p>
                    </div>
                </div>
            </div>

            {/* Resumo do mês */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginTop: 24 }}>
                <AdminStatCard
                    label="Minha Comissão (mês)"
                    value={formatGs(resumo.comissaoMes)}
                    icon={CircleDollarSign}
                    color="success"
                />
                <AdminStatCard
                    label="Faturamento do Grupo (mês)"
                    value={formatGs(resumo.faturamentoGrupoMes)}
                    icon={TrendingUp}
                    color="info"
                />
                <AdminStatCard
                    label="Maletas Ativas"
                    value={`${resumo.maletasAtivas}`}
                    icon={Briefcase}
                    color="warning"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginTop: 12 }}>
                <AdminStatCard
                    label="Revendedoras Ativas"
                    value={`${resumo.revendedorasAtivas} / ${resumo.revendedorasTotal}`}
                    icon={Users}
                />
                <AdminStatCard
                    label="Maletas Aguard. Conf."
                    value={`${resumo.maletasAguardando}`}
                    icon={Briefcase}
                    color={resumo.maletasAguardando > 0 ? "danger" : "default"}
                />
                <AdminStatCard
                    label="Comissão Total (histórico)"
                    value={formatGs(resumo.comissaoTotal)}
                    icon={Wallet}
                    color="success"
                />
            </div>

            {/* Links rápidos */}
            <div className="admin-card" style={{ marginTop: 24 }}>
                <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif" }}
                >
                    ACESSOS RÁPIDOS
                </h3>
                <div className="flex flex-col gap-2">
                    <Link
                        href="/admin/minha-conta/comissoes"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Ver Extrato de Comissões</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                    <Link
                        href="/admin/analytics"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Analytics do Grupo</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                    <Link
                        href="/admin/revendedoras"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Minhas Revendedoras</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
