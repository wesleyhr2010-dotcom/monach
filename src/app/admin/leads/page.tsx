"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getLeads, aprovarLead, recusarLead } from "../actions-leads";
import { getColaboradoras } from "../actions-equipe";
import type { LeadItem } from "../actions-leads";
import AprovarModal from "./AprovarModal";
import RecusarModal from "./RecusarModal";
import { UserPlus, Check, X, Filter, Mail, Phone, MapPin, FileText } from "lucide-react";

const TABS = [
  { key: "pendente", label: "Pendientes" },
  { key: "aprovado", label: "Aprobadas" },
  { key: "rejeitado", label: "Rechazadas" },
];

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

  async function handleRecusar(observacao: string) {
    if (!recusarLeadItem) return;
    startTransition(async () => {
      await recusarLead(recusarLeadItem.id, observacao);
      setRecusarLeadItem(null);
      loadLeads();
    });
  }

  const counts = {
    pendente: leads.filter((l) => l.status === "pendente").length,
    aprovado: leads.filter((l) => l.status === "aprovado").length,
    rejeitado: leads.filter((l) => l.status === "rejeitado").length,
  };

  return (
    <>
      <header className="admin-header">
        <h1>
          <UserPlus className="w-6 h-6 inline-block mr-2" />
          Leads Revendedoras
        </h1>
      </header>

      <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--admin-border)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #35605a" : "2px solid transparent",
                background: "transparent",
                color: activeTab === tab.key ? "var(--admin-text)" : "var(--admin-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "10px",
                  background: activeTab === tab.key ? "#35605a" : "var(--admin-border)",
                  color: activeTab === tab.key ? "#fff" : "var(--admin-text-muted)",
                }}
              >
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Leads grid */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "var(--admin-text-muted)" }}>
            Carregando...
          </p>
        ) : leads.length === 0 ? (
          <div
            className="admin-empty"
            style={{ padding: "48px", textAlign: "center" }}
          >
            <Filter size={32} style={{ color: "var(--admin-text-muted)", marginBottom: "12px" }} />
            <p style={{ color: "var(--admin-text-muted)" }}>
              Nenhuma lead {activeTab} encontrada.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onAprovar={() => setAprovarLeadItem(lead)}
                onRecusar={() => setRecusarLeadItem(lead)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      {aprovarLeadItem && (
        <AprovarModal
          lead={aprovarLeadItem}
          colaboradoras={colaboradoras}
          onApprove={handleAprovar}
          onClose={() => setAprovarLeadItem(null)}
          isPending={isPending}
        />
      )}
      {recusarLeadItem && (
        <RecusarModal
          lead={recusarLeadItem}
          onReject={handleRecusar}
          onClose={() => setRecusarLeadItem(null)}
          isPending={isPending}
        />
      )}
    </>
  );
}

function LeadCard({
  lead,
  onAprovar,
  onRecusar,
  isPending,
}: {
  lead: LeadItem;
  onAprovar: () => void;
  onRecusar: () => void;
  isPending: boolean;
}) {
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pendente: { bg: "#f59e0b20", color: "#f59e0b", label: "Pendiente" },
    aprovado: { bg: "#10b98120", color: "#10b981", label: "Aprobada" },
    rejeitado: { bg: "#ef444420", color: "#ef4444", label: "Rechazada" },
  };
  const s = statusConfig[lead.status] || statusConfig.pendente;

  return (
    <div
      className="admin-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{lead.nome}</h3>
          <p style={{ fontSize: "12px", color: "var(--admin-text-muted)", margin: "4px 0 0" }}>
            {new Date(lead.created_at).toLocaleDateString("es-PY", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "4px",
            background: s.bg,
            color: s.color,
          }}
        >
          {s.label}
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
