import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getMinhaConta } from "./actions";
import { formatGs, formatPct } from "@/lib/format";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
    const user = await getCurrentUser();
    if (!user || user.role !== "COLABORADORA") {
        redirect("/admin");
    }

    const result = await getMinhaConta();
    if (!result.success) {
        redirect("/admin");
    }
    const { perfil, resumo } = result.data;

    return (
        <>
            <AdminTopHeader breadcrumb="Admin" title="Mi Cuenta" />
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Perfil */}
            <div className="admin-card">
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
                            Tasa de Comisión: {formatPct(perfil.taxa_comissao)}
                        </div>
                        <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
                            Definida por el administrador
                        </p>
                    </div>
                </div>
            </div>

            {/* Resumo do mês */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AdminStatCard
                    label="Mi Comisión (mes)"
                    value={formatGs(resumo.comissaoMes)}
                    icon={<CircleDollarSign className="w-5 h-5 inline mr-2 -mt-1" />}
                    color="success"
                />
                <AdminStatCard
                    label="Facturación del Grupo (mes)"
                    value={formatGs(resumo.faturamentoGrupoMes)}
                    icon={<TrendingUp className="w-5 h-5 inline mr-2 -mt-1" />}
                    color="info"
                />
                <AdminStatCard
                    label="Maletines Activos"
                    value={`${resumo.maletasAtivas}`}
                    icon={<Briefcase className="w-5 h-5 inline mr-2 -mt-1" />}
                    color="warning"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AdminStatCard
                    label="Revendedoras Activas"
                    value={`${resumo.revendedorasAtivas} / ${resumo.revendedorasTotal}`}
                    icon={<Users className="w-5 h-5 inline mr-2 -mt-1" />}
                />
                <AdminStatCard
                    label="Maletines Pend. Conf."
                    value={`${resumo.maletasAguardando}`}
                    icon={<Briefcase className="w-5 h-5 inline mr-2 -mt-1" />}
                    color={resumo.maletasAguardando > 0 ? "danger" : "default"}
                />
                <AdminStatCard
                    label="Comisión Total (histórico)"
                    value={formatGs(resumo.comissaoTotal)}
                    icon={<Wallet className="w-5 h-5 inline mr-2 -mt-1" />}
                    color="success"
                />
            </div>

            {/* Links rápidos */}
            <div className="admin-card">
                <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif" }}
                >
                    ACCESOS RÁPIDOS
                </h3>
                <div className="flex flex-col gap-2">
                    <Link
                        href="/admin/mi-cuenta/comissoes"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Ver Extracto de Comisiones</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                    <Link
                        href="/admin/analytics"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Analytics del Grupo</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                    <Link
                        href="/admin/revendedoras"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: "1px solid var(--admin-border)" }}
                    >
                        <span className="text-sm">Mis Revendedoras</span>
                        <ArrowRight size={16} style={{ color: "var(--admin-text-muted)" }} />
                    </Link>
                </div>
            </div>

            {/* Apariencia */}
            <div className="admin-card">
                <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif" }}
                >
                    APARIENCIA
                </h3>
                <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--admin-text)" }}>Tema</span>
                    <ThemeToggle variant="admin" />
                </div>
            </div>
            </div>
        </>
    );
}
