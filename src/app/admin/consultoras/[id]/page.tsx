"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPerfilConsultora, atualizarMembro } from "../../actions-equipe";
import type { ConsultoraPerfil } from "@/lib/types";
import { formatGsCompact, formatPct } from "@/lib/format";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import {
    Phone,
    Mail,
    ArrowRight,
    Package,
    Award,
    X,
} from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function ConsultoraPerfilPage() {
    const params = useParams();
    const id = (params?.id as string) || "";
    const [perfil, setPerfil] = useState<ConsultoraPerfil | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [showEdit, setShowEdit] = useState(false);

    useEffect(() => {
        if (!id) return;
        async function fetchPerfil() {
            setLoading(true);
            const data = await getPerfilConsultora(id);
            setPerfil(data);
            setLoading(false);
        }
        fetchPerfil();
    }, [id]);

    function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await atualizarMembro(id, fd);
            if (res.success) {
                toast.success("Dados atualizados com sucesso!");
                setShowEdit(false);
                const data = await getPerfilConsultora(id);
                setPerfil(data);
            } else {
                toast.error(res.error || "Erro ao atualizar");
            }
        });
    }

    if (loading) {
        return (
            <>
                <AdminTopHeader breadcrumb="Consultoras" backHref="/admin/consultoras" title="Perfil de la Consultora" />
                <div style={{ padding: "28px 32px", color: "var(--admin-text-muted)", fontSize: 14 }}>Cargando perfil...</div>
            </>
        );
    }

    if (!perfil) {
        return (
            <>
                <AdminTopHeader breadcrumb="Consultoras" backHref="/admin/consultoras" title="Perfil de la Consultora" />
                <div style={{ padding: "28px 32px", color: "var(--admin-text-muted)", fontSize: 14 }}>Consultora não encontrada</div>
            </>
        );
    }

    return (
        <>
            <AdminTopHeader
                breadcrumb="Consultoras"
                backHref="/admin/consultoras"
                title={perfil.name}
                action={
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setShowEdit(true)}>
                            Editar Datos
                        </button>
                        <button
                            className="admin-btn"
                            style={{
                                background: "rgba(220,53,69,0.12)",
                                color: "var(--admin-danger)",
                                border: "1px solid rgba(220,53,69,0.3)",
                            }}
                        >
                            {perfil.is_active ? "Desativar" : "Reativar"}
                        </button>
                    </div>
                }
            />

            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Identity Card */}
                <div className="admin-card">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                        <AdminAvatar src={perfil.avatar_url} name={perfil.name} size="lg" />
                        <div style={{ flex: 1, minWidth: 240 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--admin-text)" }}>{perfil.name}</h2>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", borderRadius: 4,
                                    background: perfil.is_active ? "rgba(74,222,128,0.12)" : "rgba(136,136,136,0.12)",
                                    color: perfil.is_active ? "var(--admin-success)" : "var(--admin-text-muted)",
                                }}>
                                    {perfil.is_active ? "ATIVA" : "INATIVA"}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "var(--admin-text-muted)", fontSize: 13 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Mail size={12} /> {perfil.email || "—"}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <Phone size={12} /> {perfil.whatsapp}
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--admin-success)" }}>
                                {formatPct(perfil.taxa_comissao)}
                            </div>
                            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--admin-text-dim)" }}>Comissão</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                        {
                            label: "Revendedoras Ativas",
                            value: String(perfil.revendedoras_ativas),
                            sub: `${perfil.revendedoras_inativas} inativa${perfil.revendedoras_inativas !== 1 ? "s" : ""}`,
                        },
                        {
                            label: "Faturamento do Grupo",
                            value: formatGsCompact(perfil.faturamento_grupo_total),
                            sub: "Total acumulado",
                            color: "var(--admin-text)" as const,
                        },
                        {
                            label: "Comissão Total",
                            value: formatGsCompact(perfil.comissao_grupo_total),
                            sub: `${formatPct(perfil.taxa_comissao)} do faturamento`,
                            color: "var(--admin-accent)" as const,
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="admin-card">
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--admin-text-dim)", marginBottom: 8 }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: stat.color ?? "var(--admin-text)" }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 4 }}>{stat.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Revendedoras do Grupo */}
                <div className="admin-card" style={{ padding: 0 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--admin-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--admin-text-dim)" }}>
                            Suas Revendedoras
                        </span>
                        <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{perfil.revendedoras.length} total</span>
                    </div>
                    {perfil.revendedoras.length === 0 ? (
                        <div style={{ padding: 24, color: "var(--admin-text-muted)", fontSize: 13 }}>Ninguna revendedora vinculada</div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Revendedora</th>
                                        <th>Maletas</th>
                                        <th>Faturamento</th>
                                        <th>Pontos</th>
                                        <th>Status</th>
                                        <th style={{ width: 50 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfil.revendedoras.map((rev) => (
                                        <tr key={rev.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <AdminAvatar src={rev.avatar_url} name={rev.name} size="sm" />
                                                    <div>
                                                        <p style={{ fontWeight: 500, fontSize: 14, color: "var(--admin-text)", margin: 0 }}>{rev.name}</p>
                                                        <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: 0 }}>Comissão: {rev.taxa_comissao}%</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--admin-text-muted)" }}>
                                                    <Package size={13} />
                                                    <span style={{ fontSize: 13 }}>{rev.maletas_count}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--admin-text)" }}>{formatGsCompact(rev.faturamento_total)}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--admin-text-muted)" }}>
                                                    <Award size={13} />
                                                    <span style={{ fontSize: 13 }}>{rev.pontos_total.toLocaleString("es-PY")}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", borderRadius: 4,
                                                    background: rev.is_active ? "rgba(74,222,128,0.12)" : "rgba(136,136,136,0.12)",
                                                    color: rev.is_active ? "var(--admin-success)" : "var(--admin-text-muted)",
                                                }}>
                                                    {rev.is_active ? "ATIVA" : "INATIVA"}
                                                </span>
                                            </td>
                                            <td>
                                                <Link href={`/admin/revendedoras/${rev.id}`}>
                                                    <button className="admin-btn-icon">
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Editar */}
            {showEdit && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 50,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        background: "var(--admin-surface)", borderRadius: 12,
                        border: "1px solid var(--admin-border)",
                        padding: 28, width: "100%", maxWidth: 480,
                        maxHeight: "90vh", overflowY: "auto",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--admin-text)", margin: 0 }}>
                                Editar Consultora
                            </h3>
                            <button className="admin-btn-icon" onClick={() => setShowEdit(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { id: "edit-name", name: "name", label: "Nombre *", required: true, defaultValue: perfil.name },
                                { id: "edit-whatsapp", name: "whatsapp", label: "WhatsApp *", required: true, defaultValue: perfil.whatsapp },
                                { id: "edit-email", name: "email", label: "Email", type: "email", defaultValue: perfil.email },
                                { id: "edit-taxa", name: "taxa_comissao", label: "Comissão %", type: "number", defaultValue: String(perfil.taxa_comissao), step: "0.01" },
                            ].map((f) => (
                                <div key={f.id}>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>{f.label}</label>
                                    <input
                                        id={f.id} name={f.name} required={f.required}
                                        type={f.type} defaultValue={f.defaultValue}
                                        step={(f as { step?: string }).step}
                                        className="admin-input" style={{ width: "100%" }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Status</label>
                                <select
                                    name="is_active"
                                    defaultValue={perfil.is_active ? "true" : "false"}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)", fontSize: 13 }}
                                >
                                    <option value="true">Ativa</option>
                                    <option value="false">Inativa</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--admin-text-dim)", display: "block", marginBottom: 6 }}>Nueva Foto</label>
                                <input name="avatar" type="file" accept="image/*" className="admin-input" style={{ width: "100%" }} />
                            </div>
                            <button type="submit" disabled={isPending} className="admin-btn admin-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                                {isPending ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
