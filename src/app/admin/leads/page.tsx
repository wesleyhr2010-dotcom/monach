"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getLeads, aprovarLead, recusarLead } from "../actions-leads";
import { getColaboradoras } from "../actions-equipe";
import type { LeadItem } from "../actions-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Check, X, Clock, Filter } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

export default function LeadsAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("status") ?? "pendente";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [colaboradoras, setColaboradoras] = useState<{ id: string; name: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  const [aprovarLeadItem, setAprovarLeadItem] = useState<LeadItem | null>(null);
  const [recusarLeadItem, setRecusarLeadItem] = useState<LeadItem | null>(null);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    loadLeads();
    loadColaboradoras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadLeads() {
    setLoading(true);
    const result = await getLeads(activeTab);
    if (result.success) {
      setLeads(result.data);
    } else {
      setLeads([]);
    }
    setLoading(false);
  }

  async function loadColaboradoras() {
    try {
      const result = await getColaboradoras();
      setColaboradoras(result.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setColaboradoras([]);
    }
  }

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams);
    params.set("status", tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function handleAprovar(colaboradoraId: string | undefined, taxaComissao: number) {
    if (!aprovarLeadItem) return;
    startTransition(async () => {
      const result = await aprovarLead(aprovarLeadItem.id, { colaboradoraId, taxaComissao });
      setAprovarLeadItem(null);
      if (result.success) {
        loadLeads();
      } else {
        alert(result.error || "Erro ao aprovar");
      }
    });
  }

    return (
        <>
            <header className="admin-header">
                <h1>
                    <UserPlus className="w-6 h-6 inline-block mr-2" />
                    Leads Revendedoras
                    {pendentes > 0 && (
                        <span style={{
                            marginLeft: "8px", fontSize: "12px", fontWeight: 700, padding: "2px 8px",
                            borderRadius: "12px", background: "var(--admin-orange)20", color: "var(--admin-orange)",
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
                                border: filter === s ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                                background: filter === s ? "var(--admin-accent)" : "transparent",
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
                            <AdminEmptyState icon={UserPlus} title="Nenhuma lead encontrada" />
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
                                                                background: "var(--admin-emerald)", color: "white", border: "none",
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
                                                                background: "var(--admin-danger)", color: "white", border: "none",
                                                                borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
                                                                fontSize: "11px", display: "flex", alignItems: "center", gap: "2px",
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" /> Recusar
                                                        </button>
                                                    </div>
                                                )}
                                                {lead.status === "aprovada" && (
                                                    <span style={{ fontSize: "11px", color: "var(--admin-emerald)" }}>
                                                        ✓ {lead.taxa_comissao}% comissão
                                                    </span>
                                                )}
                                                {lead.status === "recusada" && lead.observacao && (
                                                    <span style={{ fontSize: "11px", color: "var(--admin-danger)" }} title={lead.observacao}>
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
        pendente: { bg: "var(--admin-orange)20", color: "var(--admin-orange)", icon: <Clock className="w-3 h-3" /> },
        aprovada: { bg: "var(--admin-emerald)20", color: "var(--admin-emerald)", icon: <Check className="w-3 h-3" /> },
        recusada: { bg: "var(--admin-danger)20", color: "var(--admin-danger)", icon: <X className="w-3 h-3" /> },
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "8px",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--admin-text-muted)" }}>
          <FileText size={13} />
          <span>{lead.cedula}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--admin-text-muted)" }}>
          <Phone size={13} />
          <span>{lead.whatsapp}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--admin-text-muted)" }}>
          <Mail size={13} />
          <span>{lead.email}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--admin-text-muted)" }}>
          <MapPin size={13} />
          <span>{lead.direccion || "—"}</span>
        </div>
      </div>

      {lead.colaboradora && (
        <p style={{ fontSize: "12px", color: "var(--admin-text-muted)", margin: 0 }}>
          Consultora: <strong>{lead.colaboradora.name}</strong>
          {lead.taxa_comissao !== null && (
            <span style={{ marginLeft: "8px" }}>• {lead.taxa_comissao}% comisión</span>
          )}
        </p>
      )}

      {lead.observacao_admin && (
        <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>
          Obs: {lead.observacao_admin}
        </p>
      )}

      {lead.status === "pendente" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button
            onClick={onAprovar}
            disabled={isPending}
            className="admin-btn admin-btn-sm"
            style={{
              background: "#10b981",
              borderColor: "#10b981",
              color: "#fff",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <Check size={14} /> Aprobar
          </button>
          <button
            onClick={onRecusar}
            disabled={isPending}
            className="admin-btn admin-btn-sm"
            style={{
              background: "#ef4444",
              borderColor: "#ef4444",
              color: "#fff",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <X size={14} /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
