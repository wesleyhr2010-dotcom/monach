"use client";

import { useState, useEffect } from "react";
import { getLeads, aprovarLead, recusarLead } from "../actions-leads";
import type { LeadItem } from "../actions-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Check, X, Clock, Filter } from "lucide-react";

export default function LeadsAdminPage() {
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [comissaoMap, setComissaoMap] = useState<Record<string, number>>({});
    const [processingId, setProcessingId] = useState<string | null>(null);

    async function reload() {
        const data = await getLeads(filter || undefined);
        setLeads(data);
        setLoading(false);
    }

    useEffect(() => { reload(); }, [filter]);

    async function handleAprovar(lead: LeadItem) {
        const taxa = comissaoMap[lead.id] || 10;
        setProcessingId(lead.id);
        const result = await aprovarLead(lead.id, taxa);
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
            <header className="admin-header">
                <h1>
                    <UserPlus className="w-6 h-6 inline-block mr-2" />
                    Leads Revendedoras
                    {pendentes > 0 && (
                        <span style={{
                            marginLeft: "8px", fontSize: "12px", fontWeight: 700, padding: "2px 8px",
                            borderRadius: "12px", background: "#f59e0b20", color: "#f59e0b",
                        }}>
                            {pendentes} pendentes
                        </span>
                    )}
                </h1>
            </header>
            <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Filter */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Filter className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
                    {["", "pendente", "aprovada", "recusada"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            style={{
                                fontSize: "12px", padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
                                border: filter === s ? "1px solid #35605a" : "1px solid var(--admin-border)",
                                background: filter === s ? "#35605a" : "transparent",
                                color: filter === s ? "white" : "var(--admin-text)",
                            }}
                        >
                            {s === "" ? "Todas" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="pt-4">
                        {loading ? (
                            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-text-muted)" }}>Carregando...</p>
                        ) : leads.length === 0 ? (
                            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-text-muted)" }}>
                                Nenhuma lead encontrada.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Cidade</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="w-40">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.nome}</TableCell>
                                            <TableCell style={{ fontSize: "13px" }}>{lead.whatsapp}</TableCell>
                                            <TableCell style={{ fontSize: "13px" }}>{lead.email}</TableCell>
                                            <TableCell style={{ fontSize: "13px" }}>{lead.cidade || "—"}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={lead.status} />
                                            </TableCell>
                                            <TableCell style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                                                {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell>
                                                {lead.status === "pendente" && (
                                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                        <input
                                                            type="number"
                                                            placeholder="% com."
                                                            defaultValue={10}
                                                            onChange={(e) => setComissaoMap((prev) => ({ ...prev, [lead.id]: Number(e.target.value) }))}
                                                            style={{
                                                                width: "50px", padding: "4px 6px", fontSize: "12px",
                                                                borderRadius: "4px", border: "1px solid var(--admin-border)",
                                                                background: "var(--admin-bg-secondary)", color: "var(--admin-text)",
                                                            }}
                                                        />
                                                        <button
                                                            disabled={processingId === lead.id}
                                                            onClick={() => handleAprovar(lead)}
                                                            style={{
                                                                background: "#10b981", color: "white", border: "none",
                                                                borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
                                                                fontSize: "11px", display: "flex", alignItems: "center", gap: "2px",
                                                            }}
                                                        >
                                                            <Check className="w-3 h-3" /> Aprovar
                                                        </button>
                                                        <button
                                                            disabled={processingId === lead.id}
                                                            onClick={() => handleRecusar(lead)}
                                                            style={{
                                                                background: "#ef4444", color: "white", border: "none",
                                                                borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
                                                                fontSize: "11px", display: "flex", alignItems: "center", gap: "2px",
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" /> Recusar
                                                        </button>
                                                    </div>
                                                )}
                                                {lead.status === "aprovada" && (
                                                    <span style={{ fontSize: "11px", color: "#10b981" }}>
                                                        ✓ {lead.taxa_comissao}% comissão
                                                    </span>
                                                )}
                                                {lead.status === "recusada" && lead.observacao && (
                                                    <span style={{ fontSize: "11px", color: "#ef4444" }} title={lead.observacao}>
                                                        {lead.observacao.slice(0, 30)}{lead.observacao.length > 30 ? "..." : ""}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
        pendente: { bg: "#f59e0b20", color: "#f59e0b", icon: <Clock className="w-3 h-3" /> },
        aprovada: { bg: "#10b98120", color: "#10b981", icon: <Check className="w-3 h-3" /> },
        recusada: { bg: "#ef444420", color: "#ef4444", icon: <X className="w-3 h-3" /> },
    };
    const s = styles[status] || styles.pendente;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "11px", fontWeight: 600, padding: "2px 8px",
            borderRadius: "4px", background: s.bg, color: s.color,
        }}>
            {s.icon} {status}
        </span>
    );
}
