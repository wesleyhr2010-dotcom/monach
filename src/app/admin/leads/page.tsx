"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";
import { getLeads, aprovarLead, recusarLead } from "../actions-leads";
import type { LeadItem } from "../actions-leads";
import { UserPlus, Check, X, Clock, Filter } from "lucide-react";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";

export default function LeadsAdminPage() {
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [comissaoMap, setComissaoMap] = useState<Record<string, number>>({});
    const [processingId, setProcessingId] = useState<string | null>(null);

    async function reload() {
        const result = await getLeads(filter || undefined);
        if (result.success) {
            setLeads(result.data);
        } else {
            setLeads([]);
        }
        setLoading(false);
    }

    useEffect(() => { reload(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleAprovar(lead: LeadItem) {
        const taxa = comissaoMap[lead.id] || 10;
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
                            {pendentes} pendentes
                        </span>
                    ) : undefined
                }
            />

            <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Filtros */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Filter size={14} style={{ color: "var(--admin-text-muted)", flexShrink: 0 }} />
                    {(["", "pendente", "aprovada", "recusada"] as const).map((s) => (
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
                            Carregando...
                        </div>
                    ) : leads.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-muted)", fontFamily: "Raleway, sans-serif", fontSize: 13 }}>
                            Nenhuma candidatura encontrada.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>WhatsApp</th>
                                        <th>Email</th>
                                        <th>Cidade</th>
                                        <th>Status</th>
                                        <th>Data</th>
                                        <th style={{ width: 180 }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td style={{ fontWeight: 600 }}>{lead.nome}</td>
                                            <td style={{ fontSize: 13 }}>{lead.whatsapp}</td>
                                            <td style={{ fontSize: 13 }}>{lead.email}</td>
                                            <td style={{ fontSize: 13 }}>{lead.direccion || "—"}</td>
                                            <td><StatusBadge status={lead.status} /></td>
                                            <td style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                                                {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td>
                                                {lead.status === "pendente" && (
                                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                        <input
                                                            type="number"
                                                            placeholder="% com."
                                                            defaultValue={10}
                                                            onChange={(e) => setComissaoMap((prev) => ({ ...prev, [lead.id]: Number(e.target.value) }))}
                                                            style={{
                                                                width: 50, padding: "4px 6px", fontSize: 12,
                                                                borderRadius: 4, border: "1px solid var(--admin-border)",
                                                                background: "var(--admin-bg)", color: "var(--admin-text)",
                                                            }}
                                                        />
                                                        <button
                                                            disabled={processingId === lead.id}
                                                            onClick={() => handleAprovar(lead)}
                                                            style={{
                                                                background: "var(--admin-success)", color: "#0a0a0a",
                                                                border: "none", borderRadius: 4, padding: "4px 8px",
                                                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                                                                display: "inline-flex", alignItems: "center", gap: 2,
                                                                opacity: processingId === lead.id ? 0.5 : 1,
                                                            }}
                                                        >
                                                            <Check size={11} /> Aprovar
                                                        </button>
                                                        <button
                                                            disabled={processingId === lead.id}
                                                            onClick={() => handleRecusar(lead)}
                                                            style={{
                                                                background: "var(--admin-danger)", color: "white",
                                                                border: "none", borderRadius: 4, padding: "4px 8px",
                                                                cursor: "pointer", fontSize: 11, fontWeight: 600,
                                                                display: "inline-flex", alignItems: "center", gap: 2,
                                                                opacity: processingId === lead.id ? 0.5 : 1,
                                                            }}
                                                        >
                                                            <X size={11} /> Recusar
                                                        </button>
                                                    </div>
                                                )}
                                                {lead.status === "aprovada" && (
                                                    <span style={{ fontSize: 11, color: "var(--admin-success)", fontWeight: 600 }}>
                                                        ✓ {lead.taxa_comissao}% comissão
                                                    </span>
                                                )}
                                                {lead.status === "rejeitado" && lead.observacao_admin && (
                                                    <span style={{ fontSize: 11, color: "var(--admin-danger)" }} title={lead.observacao_admin}>
                                                        {lead.observacao_admin.slice(0, 30)}{lead.observacao_admin.length > 30 ? "..." : ""}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
        pendente: { bg: "var(--admin-warning-10)", color: "var(--admin-warning)", icon: <Clock size={11} /> },
        aprovada: { bg: "var(--admin-success-10)", color: "var(--admin-success)", icon: <Check size={11} /> },
        recusada: { bg: "var(--admin-danger-10)", color: "var(--admin-danger)", icon: <X size={11} /> },
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
