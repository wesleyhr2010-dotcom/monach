import Link from "next/link";
import { getSolicitacoes } from "../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { SolicitudActions } from "../SolicitudActions";
import { Gift, Clock, Package, CheckCircle } from "lucide-react";

export const metadata = {
    title: "Solicitudes de Brindes — Monarca Admin",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pendente: { label: "Pendiente", color: "#e6a23c", icon: <Clock size={14} /> },
    separado: { label: "Separado", color: "#5b8bf7", icon: <Package size={14} /> },
    entregado: { label: "Entregado", color: "#27ae60", icon: <CheckCircle size={14} /> },
    cancelado: { label: "Cancelado", color: "var(--admin-text-dim)", icon: <Clock size={14} /> },
};

export default async function SolicitudesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const solicitaciones = await getSolicitacoes(status);

    return (
        <div className="admin-content">
            <AdminPageHeader
                title="Solicitudes de Brindes"
                backHref="/admin/brindes"
            />

            {/* Filtros */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["todas", "pendente", "separado", "entregado"].map((s) => (
                    <Link
                        key={s}
                        href={`/admin/brindes/solicitudes${s === "todas" ? "" : `?status=${s}`}`}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: "none",
                            background: (status || "todas") === s ? "var(--admin-accent)" : "var(--admin-surface)",
                            color: (status || "todas") === s ? "#fff" : "var(--admin-text-muted)",
                            border: "1px solid var(--admin-border)",
                        }}
                    >
                        {s === "todas" ? "Todas" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Link>
                ))}
            </div>

            {solicitaciones.length === 0 ? (
                <AdminEmptyState
                    icon={Gift}
                    title="Ninguna solicitud"
                    description="No hay solicitudes de canje en este filtro."
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {solicitaciones.map((s) => (
                        <SolicitudCard key={s.id} solicitud={s} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SolicitudCard({ solicitud }: { solicitud: { id: string; status: string; pontos_debitados: number; created_at: Date; reseller: { name: string | null }; brinde: { nome: string; imagem_url: string } } }) {
    const statusConfig = STATUS_CONFIG[solicitud.status] ?? STATUS_CONFIG.pendente;

    return (
        <div style={{
            display: "flex",
            gap: 16,
            padding: 16,
            background: "var(--admin-surface)",
            borderRadius: 12,
            border: "1px solid var(--admin-border)",
        }}>
            <img
                src={solicitud.brinde.imagem_url}
                alt={solicitud.brinde.nome}
                style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "var(--admin-border)",
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                        {solicitud.reseller.name || "Revendedora"}
                    </h3>
                    <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: statusConfig.color,
                        background: `${statusConfig.color}20`,
                        padding: "2px 8px",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}>
                        {statusConfig.icon}
                        {statusConfig.label}
                    </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--admin-text-muted)", margin: "0 0 4px" }}>
                    🎁 {solicitud.brinde.nome} · -{solicitud.pontos_debitados} pts
                </p>
                <p style={{ fontSize: 12, color: "var(--admin-text-dim)", margin: 0 }}>
                    📅 {new Date(solicitud.created_at).toLocaleDateString("es-PY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
            </div>
            <SolicitudActions id={solicitud.id} status={solicitud.status} />
        </div>
    );
}
