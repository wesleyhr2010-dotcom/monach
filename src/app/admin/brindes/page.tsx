import Link from "next/link";
import { getBrindes, getSolicitacoesPendentesCount } from "./actions";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Gift, AlertTriangle, Plus } from "lucide-react";

export const metadata = {
    title: "Brindes — Monarca Admin",
};

export default async function BrindesPage() {
    const [brindes, pendentesCount] = await Promise.all([
        getBrindes(),
        getSolicitacoesPendentesCount(),
    ]);

    return (
        <>
            <AdminTopHeader
                breadcrumb="Admin / Brindes"
                title="Brindes y Regalos"
                action={
                    <Link
                        href="/admin/brindes/nuevo"
                        className="admin-btn admin-btn-primary"
                        style={{ borderRadius: "var(--admin-radius-pill)", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                        <Plus size={14} />
                        Nuevo Brinde
                    </Link>
                }
            />

            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            {pendentesCount > 0 && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 18px",
                    background: "var(--admin-warning-15)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 12,
                }}>
                    <AlertTriangle size={20} color="#e6a23c" />
                    <span style={{ color: "#e6a23c", fontSize: 14, fontWeight: 500 }}>
                        {pendentesCount} solicitud{pendentesCount > 1 ? "es" : ""} pendiente{pendentesCount > 1 ? "s" : ""} de entrega
                    </span>
                    <Link
                        href="/admin/brindes/solicitudes"
                        style={{
                            marginLeft: "auto",
                            color: "#e6a23c",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "underline",
                        }}
                    >
                        Ver →
                    </Link>
                </div>
            )}

            {brindes.length === 0 ? (
                <AdminEmptyState
                    icon={Gift}
                    title="Ningún brinde registrado"
                    description="Crea el primer regalo que las revendedoras podrán canjear con sus puntos."
                    action={
                        <Link
                            href="/admin/brindes/nuevo"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 14px",
                                background: "var(--admin-accent)",
                                color: "#fff",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: "none",
                            }}
                        >
                            <Plus size={16} />
                            Crear Brinde
                        </Link>
                    }
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {brindes.map((brinde) => (
                        <BrindeCard key={brinde.id} brinde={brinde} />
                    ))}
                </div>
            )}
            </div>
        </>
    );
}

function BrindeCard({ brinde }: { brinde: { id: string; nome: string; descricao: string; imagem_url: string; custo_pontos: number; estoque: number; ativo: boolean } }) {
    const estoqueLabel = brinde.estoque < 0 ? "Ilimitado" : `${brinde.estoque} unid.`;
    const estoqueColor = brinde.estoque === 0 ? "#C0392B" : brinde.estoque < 0 ? "var(--admin-text-dim)" : "var(--admin-accent)";

    return (
        <div style={{
            display: "flex",
            gap: 16,
            padding: 16,
            background: "var(--admin-surface)",
            borderRadius: 12,
            border: "1px solid var(--admin-border)",
            opacity: brinde.ativo ? 1 : 0.6,
        }}>
            <img
                src={brinde.imagem_url}
                alt={brinde.nome}
                style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10,
                    background: "var(--admin-border)",
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                        {brinde.nome}
                    </h3>
                    {!brinde.ativo && (
                        <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--admin-text-dim)",
                            background: "var(--admin-border)",
                            padding: "2px 8px",
                            borderRadius: 4,
                        }}>
                            INACTIVO
                        </span>
                    )}
                </div>
                <p style={{ fontSize: 13, color: "var(--admin-text-muted)", margin: "0 0 8px", lineHeight: 1.4 }}>
                    {brinde.descricao || "Sin descripción"}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--admin-text-muted)" }}>
                    <span>⭐ {brinde.custo_pontos.toLocaleString("es-PY")} pts</span>
                    <span style={{ color: estoqueColor }}>📦 Stock: {estoqueLabel}</span>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                <Link
                    href={`/admin/brindes/${brinde.id}/editar`}
                    style={{
                        padding: "6px 14px",
                        background: "var(--admin-border)",
                        color: "#fff",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        textDecoration: "none",
                        textAlign: "center",
                    }}
                >
                    Editar
                </Link>
            </div>
        </div>
    );
}
