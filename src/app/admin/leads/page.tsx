"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";
import { getLeads, aprovarLead, recusarLead } from "../actions-leads";
import type { LeadItem } from "../actions-leads";
import { UserPlus, Check, X, Clock, Filter, ChevronRight, Instagram, Phone, Mail, MapPin, Briefcase, FileText, Users, Calendar } from "lucide-react";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export default function LeadsAdminPage() {
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [comissaoMap, setComissaoMap] = useState<Record<string, number>>({});
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<LeadItem | null>(null);

    async function reload() {
        const result = await getLeads(filter || undefined);
        if (result.success) {
            setLeads(result.data);
            // Atualiza o drawer se o lead selecionado mudou de status
            if (selected) {
                const updated = result.data.find((l) => l.id === selected.id);
                if (updated) setSelected(updated);
            }
        } else {
            setLeads([]);
        }
        setLoading(false);
    }

    useEffect(() => { reload(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

    // Bloquear scroll quando drawer aberto
    useEffect(() => {
        document.body.style.overflow = selected ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [selected]);

    async function handleAprovar(lead: LeadItem) {
        const taxa = comissaoMap[lead.id] ?? 10;
        setProcessingId(lead.id);
        const result = await aprovarLead(lead.id, { taxaComissao: taxa });
        setProcessingId(null);
        if (result.success) {
            reload();
        } else {
            alert(result.error || "Erro ao aprovar");
        }
    }

    async function handleRecusar(lead: LeadItem) {
        const obs = prompt("Motivo da recusa (opcional):", "");
        if (obs === null) return;
        setProcessingId(lead.id);
        await recusarLead(lead.id, obs || "");
        setProcessingId(null);
        reload();
    }

    const pendentes = leads.filter((l) => l.status === "pendente").length;

    return (
        <>
            <AdminTopHeader
                breadcrumb="Admin / Candidaturas"
                title="Candidaturas"
                action={
                    pendentes > 0 ? (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                            background: "var(--admin-warning-15)", color: "var(--admin-warning)", border: "1px solid var(--admin-border)",
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--admin-warning)" }} />
                            {pendentes} pendientes
                        </span>
                    ) : undefined
                }
            />

            <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Filtros */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Filter size={14} style={{ color: "var(--admin-text-muted)", flexShrink: 0 }} />
                    {(["", "pendente", "aprovado", "rejeitado"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            style={{
                                fontSize: 12, padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                                border: filter === s ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                                background: filter === s ? "var(--admin-accent)" : "transparent",
                                color: filter === s ? "white" : "var(--admin-text-muted)",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {s === "" ? "Todas" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tabela */}
                <div style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-surface-hover)", borderRadius: 12, overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontSize: 13 }}>
                            Cargando...
                        </div>
                    ) : leads.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontSize: 13 }}>
                            Ninguna candidatura encontrada.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>WhatsApp</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Fecha</th>
                                        <th style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelected(lead)}
                                            style={{ cursor: "pointer" }}
                                            className="admin-table-row-hover"
                                        >
                                            <td style={{ fontWeight: 600 }}>{lead.nome}</td>
                                            <td style={{ fontSize: 13 }}>{lead.whatsapp}</td>
                                            <td style={{ fontSize: 13 }}>{lead.email || "—"}</td>
                                            <td><StatusBadge status={lead.status} /></td>
                                            <td style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                                                {new Date(lead.created_at).toLocaleDateString("es-PY")}
                                            </td>
                                            <td>
                                                <ChevronRight size={14} style={{ color: "var(--admin-text-muted)" }} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Drawer de detalhes */}
            {selected && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
                    {/* Overlay */}
                    <div
                        onClick={() => setSelected(null)}
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }}
                    />

                    {/* Painel */}
                    <div style={{
                        position: "relative", width: "100%", maxWidth: 460, height: "100%",
                        background: "var(--admin-surface)", borderLeft: "1px solid var(--admin-border)",
                        display: "flex", flexDirection: "column", animation: "slideInRight 0.25s ease",
                        overflowY: "auto",
                    }}>
                        {/* Header */}
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--admin-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--admin-text-muted)", margin: "0 0 4px" }}>
                                    Candidatura
                                </p>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--admin-text)", margin: 0 }}>
                                    {selected.nome}
                                </h2>
                                <div style={{ marginTop: 6 }}>
                                    <StatusBadge status={selected.status} />
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--admin-text-muted)", padding: 4, borderRadius: 4, flexShrink: 0 }}
                                aria-label="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo */}
                        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                            {/* Identificación */}
                            <Section title="Identificación">
                                <Field icon={<UserPlus size={14} />} label="Nombre completo" value={selected.nome} />
                                <Field icon={<FileText size={14} />} label="Cédula de identidad" value={selected.cedula} />
                                <Field icon={<Calendar size={14} />} label="Edad" value={selected.edad || "—"} />
                                <Field icon={<Users size={14} />} label="Estado civil" value={selected.estado_civil || "—"} />
                                <Field icon={<Users size={14} />} label="Hijos" value={selected.hijos || "—"} />
                            </Section>

                            {/* Contacto */}
                            <Section title="Contacto">
                                <Field icon={<Mail size={14} />} label="Correo electrónico" value={selected.email || "—"} />
                                <Field icon={<Phone size={14} />} label="WhatsApp" value={selected.whatsapp} />
                                <Field icon={<Instagram size={14} />} label="Instagram" value={selected.instagram ? `@${selected.instagram}` : "—"} />
                            </Section>

                            {/* Ubicación y trabajo */}
                            <Section title="Ubicación y trabajo">
                                <Field icon={<MapPin size={14} />} label="Dirección completa" value={selected.direccion || "—"} />
                                <Field icon={<Briefcase size={14} />} label="Trabajo actual" value={selected.empresa || "—"} />
                            </Section>

                            {/* Informconf */}
                            <Section title="Situación financiera">
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--admin-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                                        Informconf
                                    </p>
                                    <p style={{ fontSize: 13, color: "var(--admin-text)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                        {selected.informconf || "—"}
                                    </p>
                                </div>
                            </Section>

                            {/* Data */}
                            <p style={{ fontSize: 12, color: "var(--admin-text-muted)", margin: 0 }}>
                                Enviado el {new Date(selected.created_at).toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>

                            {/* Info se aprovado/rejeitado */}
                            {selected.status === "aprovado" && selected.taxa_comissao && (
                                <div style={{ padding: "12px 16px", background: "var(--admin-success-10)", borderRadius: 8, border: "1px solid var(--admin-success-20)" }}>
                                    <p style={{ fontSize: 12, color: "var(--admin-success)", margin: 0, fontWeight: 600 }}>
                                        ✓ Aprobada — {selected.taxa_comissao}% de comisión
                                        {selected.colaboradora && ` · Consultora: ${selected.colaboradora.name}`}
                                    </p>
                                </div>
                            )}
                            {selected.status === "rejeitado" && selected.observacao_admin && (
                                <div style={{ padding: "12px 16px", background: "var(--admin-danger-10)", borderRadius: 8, border: "1px solid var(--admin-danger-20)" }}>
                                    <p style={{ fontSize: 12, color: "var(--admin-danger)", margin: 0, fontWeight: 600 }}>
                                        Motivo: {selected.observacao_admin}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer com ações (só para pendentes) */}
                        {selected.status === "pendente" && (
                            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <label style={{ fontSize: 12, color: "var(--admin-text-muted)", flexShrink: 0 }}>
                                        % comisión:
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue={10}
                                        onChange={(e) => setComissaoMap((prev) => ({ ...prev, [selected.id]: Number(e.target.value) }))}
                                        style={{
                                            width: 64, padding: "6px 8px", fontSize: 13,
                                            borderRadius: 6, border: "1px solid var(--admin-border)",
                                            background: "var(--admin-bg)", color: "var(--admin-text)",
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        disabled={processingId === selected.id}
                                        onClick={() => handleAprovar(selected)}
                                        style={{
                                            flex: 1, background: "var(--admin-success)", color: "#0a0a0a",
                                            border: "none", borderRadius: 8, padding: "10px 0",
                                            cursor: "pointer", fontSize: 13, fontWeight: 700,
                                            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            opacity: processingId === selected.id ? 0.5 : 1,
                                        }}
                                    >
                                        <Check size={14} /> Aprobar
                                    </button>
                                    <button
                                        disabled={processingId === selected.id}
                                        onClick={() => handleRecusar(selected)}
                                        style={{
                                            flex: 1, background: "var(--admin-danger)", color: "white",
                                            border: "none", borderRadius: 8, padding: "10px 0",
                                            cursor: "pointer", fontSize: 13, fontWeight: 700,
                                            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            opacity: processingId === selected.id ? 0.5 : 1,
                                        }}
                                    >
                                        <X size={14} /> Rechazar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .admin-table-row-hover:hover { background: var(--admin-surface-hover) !important; }
            `}</style>
        </>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--admin-text-muted)", margin: 0 }}>
                {title}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {children}
            </div>
        </div>
    );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ color: "var(--admin-text-muted)", marginTop: 2, flexShrink: 0 }}>{icon}</span>
            <div>
                <p style={{ fontSize: 11, color: "var(--admin-text-muted)", margin: "0 0 1px" }}>{label}</p>
                <p style={{ fontSize: 13, color: "var(--admin-text)", margin: 0, fontWeight: 500 }}>{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
        pendente: { bg: "var(--admin-warning-10)", color: "var(--admin-warning)", icon: <Clock size={11} /> },
        aprovado: { bg: "var(--admin-success-10)", color: "var(--admin-success)", icon: <Check size={11} /> },
        rejeitado: { bg: "var(--admin-danger-10)", color: "var(--admin-danger)", icon: <X size={11} /> },
    };
    const s = styles[status] || styles.pendente;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            borderRadius: 4, background: s.bg, color: s.color,
        }}>
            {s.icon} {status}
        </span>
    );
}
