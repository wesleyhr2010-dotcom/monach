"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { getMaletas, checkOverdueMaletas, getColaboradoras } from "@/app/admin/actions-maletas";
import type { MaletaListItem } from "@/app/admin/actions-maletas";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge, getStatusRowStyle } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { fmtCurrency, daysRemaining, daysLabel, daysColorClass, type MaletaStatus } from "@/lib/maleta-helpers";
import { Briefcase, Plus, ArrowRight } from "lucide-react";

export default function MaletasPage() {
  const [maletas, setMaletas] = useState<MaletaListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [colaboradoraFilter, setColaboradoraFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [colaboradoras, setColaboradoras] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadColaboradoras() {
    const cols = await getColaboradoras();
    setColaboradoras(cols);
  }

  async function loadMaletas() {
    setLoading(true);
    try {
      await checkOverdueMaletas();
      const data = await getMaletas(
        undefined,
        statusFilter === "all" ? undefined : statusFilter,
        colaboradoraFilter === "all" ? undefined : colaboradoraFilter,
        searchQuery || undefined
      );
      setMaletas(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => { loadColaboradoras(); }, []);
  useEffect(() => { loadMaletas(); }, [statusFilter, colaboradoraFilter]);

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-loading"><div className="admin-spinner" /></div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <AdminPageHeader
        title="Maletas"
        breadcrumb="Admin / Maletas"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/admin/maleta/nova">
              <button className="admin-btn admin-btn-primary" style={{ borderRadius: "var(--admin-radius-pill)" }}>
                <Plus className="w-3.5 h-3.5" style={{ marginRight: 6 }} />
                Nova Maleta
              </button>
            </Link>
          </div>
        }
      />

      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={loadMaletas}
        searchPlaceholder="Buscar revendedora..."
        filters={[
          {
            key: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [
              { value: "ativa", label: "Activas" },
              { value: "atrasada", label: "Atrasadas" },
              { value: "aguardando_revisao", label: "Ag. Conferencia" },
              { value: "concluida", label: "Concluidas" },
            ],
          },
          ...(colaboradoras.length > 0
            ? [{
                key: "colaboradora",
                value: colaboradoraFilter,
                onChange: setColaboradoraFilter,
                placeholder: "Consultora",
                options: colaboradoras.map((c) => ({ value: c.id, label: c.name })),
              }]
            : []),
        ]}
        onClear={
          statusFilter !== "all" || colaboradoraFilter !== "all" || searchQuery
            ? () => {
                setStatusFilter("all");
                setColaboradoraFilter("all");
                setSearchQuery("");
                loadMaletas();
              }
            : undefined
        }
      />

      {maletas.length === 0 ? (
        <AdminEmptyState
          icon={Briefcase}
          title="Ninguna consignación encontrada"
          description="Crea la primera consignación para una revendedora."
          action={
            <Link href="/admin/maleta/nova">
              <button className="admin-btn admin-btn-primary" style={{ borderRadius: "var(--admin-radius-pill)" }}>
                <Plus className="w-3.5 h-3.5" style={{ marginRight: 6 }} />
                Crear Consignación
              </button>
            </Link>
          }
        />
      ) : (
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Revendedora</th>
                  <th>Consultora</th>
                  <th>Estado</th>
                  <th style={{ width: 130 }}>Plazo</th>
                  <th style={{ width: 100 }}>Total</th>
                  <th style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {maletas.map((m) => {
                  const days = daysRemaining(m.data_limite);
                  const rowStyle = getStatusRowStyle(m.status as MaletaStatus);
                  return (
                    <tr key={m.id} style={rowStyle}>
                      <td>
                        <span
                          style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif", fontWeight: 700, fontSize: 13 }}
                        >
                          #{m.numero}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <AdminAvatar src={m.reseller.avatar_url} name={m.reseller.name} size="sm" />
                          <span style={{ color: "#dddddd", fontFamily: "Raleway, system-ui, sans-serif", fontSize: 13 }}>{m.reseller.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "var(--admin-text-muted)", fontFamily: "Raleway, system-ui, sans-serif", fontSize: 12 }}>
                          —
                        </span>
                      </td>
                      <td>
                        <AdminStatusBadge status={m.status as MaletaStatus} />
                      </td>
                      <td>
                        {(m.status === "ativa" || m.status === "atrasada") ? (
                          <span className={`text-xs font-medium ${daysColorClass(days)}`} style={{ fontFamily: "Raleway, system-ui, sans-serif" }}>
                            {daysLabel(days)}
                          </span>
                        ) : (
                          <span style={{ color: m.status === "concluida" ? "var(--admin-text-dim)" : "var(--admin-text-muted)", fontFamily: "Raleway, system-ui, sans-serif", fontSize: 12 }}>
                            {new Date(m.data_limite).toLocaleDateString("es-PY")}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: "var(--admin-text-muted)", fontFamily: "'Playfair Display', system-ui, serif", fontWeight: 600, fontSize: 12 }}>
                          {fmtCurrency(m.valor_total_vendido)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/maleta/${m.id}`}>
                          <button
                            className="admin-btn-icon"
                            style={{
                              borderRadius: 7,
                              background: m.status === "atrasada" ? "#2A1A1A" :
                                          m.status === "aguardando_revisao" ? "#2A2A1A" :
                                          "#1E1E1E",
                            }}
                          >
                            <ArrowRight
                              className="w-3 h-3"
                              style={{ color: m.status === "atrasada" ? "#E05C5C" : m.status === "aguardando_revisao" ? "#FACC15" : "#666666" }}
                            />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {maletas.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif", fontSize: 12 }}>
            {maletas.length} consignaciones encontradas
          </span>
        </div>
      )}
    </div>
  );
}