import Link from "next/link";
import { ResellerSelect } from "./ResellerSelect";
import { DateRangeSelect } from "./DateRangeSelect";
import { redirect } from "next/navigation";
import {
  getAnalyticsKPIs,
  getAnalyticsFluxoMaletas,
  getAnalyticsDistribuicaoStatus,
  getAnalyticsTopRevendedoras,
  getAnalyticsAlertasPrazo,
  getAnalyticsProdutosMaisVendidos,
  getVitrinaKPIs,
  getVitrinaVisitasSeries,
  getVitrinaRankingRevendedoras,
  exportVitrinaAnalyticsCSV,
  getResellersForAnalytics,
  getRangeFromParams,
  type AnalyticsKPIs,
  type FluxoDia,
  type DistribuicaoStatus,
  type TopRevendedoraVolume,
  type AlertaPrazo,
  type ProdutoMaisVendido,
  type VitrinaKPIs,
  type VitrinaDia,
  type VitrinaRankingItem,
} from "../actions-analytics";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AnalyticsKpiCards } from "./AnalyticsKpiCards";
import { AnalyticsVitrinaKpiCards } from "./AnalyticsVitrinaKpiCards";
import { AnalyticsVisitasChart } from "./AnalyticsVisitasChart";
import { AnalyticsVitrinaRanking } from "./AnalyticsVitrinaRanking";
import { VitrinaCsvDownload } from "./VitrinaCsvDownload";
import {
  PackageCheck,
  BarChart3,
  TrendingUp,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ============================================
// Helpers
// ============================================

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `G$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `G$ ${(value / 1_000).toFixed(1)}K`;
  return `G$ ${value.toFixed(0)}`;
}

function formatDatePY(date: Date) {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Asuncion",
  }).format(new Date(date));
}

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "3m", days: 90 },
  { label: "12m", days: 365 },
];

// ============================================
// Donut SVG Component
// ============================================

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "40px 0" }}>
        Sin datos
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<
    Array<{ dash: number; offset: number; color: string }>
  >((acc, d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ dash, offset: prevOffset, color: d.color });
    return acc;
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width="140" height="140" viewBox="0 0 100 100">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="var(--admin-text)" fontSize="14" fontWeight="700">
          {total}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
            <span style={{ color: "var(--admin-text-muted)" }}>{d.label}</span>
            <span style={{ fontWeight: 600, color: "var(--admin-text)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; reseller?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const periodParam = params.period || "30";
  const periodDays = parseInt(periodParam, 10);
  const resellerParam = params.reseller || "";
  const selectedResellerId = resellerParam || undefined;
  const fromStr = params.from;
  const toStr = params.to;

  const hasCustomRange = !!fromStr && !!toStr;

  // Compute date range
  let from: Date;
  let to: Date;
  let rangeError: string | null = null;

  if (hasCustomRange) {
    const r = await getRangeFromParams(undefined, fromStr, toStr);
    from = r.from;
    to = r.to;
    const diffMs = to.getTime() - from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 366) {
      rangeError = "El rango seleccionado no puede superar 366 días.";
    }
  } else {
    if (!PERIOD_OPTIONS.some((o) => o.days === periodDays)) {
      redirect("/admin/analytics?period=30");
    }
    const r = await getRangeFromParams(periodDays);
    from = r.from;
    to = r.to;
  }

  // Fetch data (or use empty values if range error)
  let kpis: AnalyticsKPIs;
  let fluxo: FluxoDia[];
  let distribuicao: DistribuicaoStatus[];
  let topRevendedoras: TopRevendedoraVolume[];
  let alertas: AlertaPrazo[];
  let produtos: ProdutoMaisVendido[];
  let vitrinaKPIs: VitrinaKPIs;
  let vitrinaSeries: VitrinaDia[];
  let vitrinaRanking: VitrinaRankingItem[];
  let resellersList: Awaited<ReturnType<typeof getResellersForAnalytics>>;
  let csvData: string;

  if (!rangeError) {
    [kpis, fluxo, distribuicao, topRevendedoras, alertas, produtos, vitrinaKPIs, vitrinaSeries, vitrinaRanking, resellersList, csvData] = await Promise.all([
      getAnalyticsKPIs(from, to),
      getAnalyticsFluxoMaletas(from, to),
      getAnalyticsDistribuicaoStatus(from, to),
      getAnalyticsTopRevendedoras(from, to, 10),
      getAnalyticsAlertasPrazo(),
      getAnalyticsProdutosMaisVendidos(from, to, 10),
      getVitrinaKPIs(from, to, selectedResellerId),
      getVitrinaVisitasSeries(from, to, selectedResellerId),
      getVitrinaRankingRevendedoras(from, to, 50),
      getResellersForAnalytics(),
      exportVitrinaAnalyticsCSV(from, to),
    ]);
  } else {
    kpis = { maletasAtivas: 0, devolvidasMes: 0, taxaAtraso: 0, ticketMedio: 0, revendedorasComMaleta: 0, tempoMedioDevolucaoDias: 0 };
    fluxo = [];
    distribuicao = [];
    topRevendedoras = [];
    alertas = [];
    produtos = [];
    vitrinaKPIs = { totalVisitas: 0, visitantesUnicos: 0, cliquesWhatsApp: 0, ctrCheckout: 0, ctrContato: 0 };
    vitrinaSeries = [];
    vitrinaRanking = [];
    resellersList = [];
    csvData = "";
  }

  const statusColorMap: Record<string, string> = {
    ativa: "#4ADE80",
    atrasada: "#E05C5C",
    aguardando_revisao: "#FACC15",
    concluida: "var(--admin-info-light)",
  };

  const donutData = distribuicao.map((d) => ({
    label: d.status.replace("_", " "),
    value: d.count,
    color: statusColorMap[d.status] || "#888",
  }));

  const maxFluxo = Math.max(
    ...fluxo.map((d) => d.enviadas + d.devolvidas + d.atrasadas),
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AdminTopHeader
        breadcrumb="Admin / Analytics"
        title="Analytics"
        action={
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>Revendedora:</span>
              <ResellerSelect
                resellers={resellersList}
                periodDays={periodDays}
                selectedResellerId={selectedResellerId}
                from={fromStr}
                to={toStr}
              />
            </div>
            <DateRangeSelect
              value={hasCustomRange ? { from, to } : undefined}
              resellerId={selectedResellerId}
            />
            <div style={{ display: "flex", gap: 6 }}>
              {PERIOD_OPTIONS.map((opt) => (
                <Link
                  key={opt.days}
                  href={`/admin/analytics?period=${opt.days}${selectedResellerId ? `&reseller=${selectedResellerId}` : ""}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    !hasCustomRange && periodDays === opt.days ? "text-white" : "hover:text-white"
                  }`}
                  style={!hasCustomRange && periodDays === opt.days
                    ? { backgroundColor: "var(--admin-accent)" }
                    : { backgroundColor: "var(--admin-surface)", color: "var(--admin-text-muted)", border: "1px solid var(--admin-border)" }
                  }
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </>
        }
      />

      {/* Body */}
      <div className="admin-page-body">

        {/* Range Error Banner */}
        {rangeError && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "var(--admin-radius)",
            background: "#E05C5C1A",
            border: "1px solid var(--admin-danger)",
            color: "var(--admin-danger)",
            fontSize: 14,
            fontWeight: 500,
          }}>
            {rangeError}
          </div>
        )}

        {/* KPIs Maletas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <AnalyticsKpiCards kpis={kpis} />
        </div>

        {/* Fluxo + Distribuição */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <AdminSectionCard
            title="Fluxo de Maletas"
            icon={<TrendingUp size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
          >
            {fluxo.length === 0 || fluxo.every((d) => d.enviadas + d.devolvidas + d.atrasadas === 0) ? (
              <p style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "40px 0", margin: 0 }}>
                Sin datos en el período
              </p>
            ) : (
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 3,
                  height: 180,
                  paddingBottom: 24,
                  position: "relative",
                }}>
                  {fluxo.map((d, i) => {
                    const isToday = i === fluxo.length - 1;
                    return (
                      <div
                        key={d.dia}
                        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative", gap: 1 }}
                        title={`${d.dia}: E=${d.enviadas} D=${d.devolvidas} A=${d.atrasadas}`}
                      >
                        <div style={{ height: `${(d.atrasadas / maxFluxo) * 100}%`, background: isToday ? "var(--admin-danger)" : "rgba(224, 92, 92, 0.6)", borderRadius: "1px 1px 0 0", minHeight: d.atrasadas > 0 ? 2 : 0 }} />
                        <div style={{ height: `${(d.devolvidas / maxFluxo) * 100}%`, background: isToday ? "var(--admin-info-light)" : "var(--admin-info-light)99", minHeight: d.devolvidas > 0 ? 2 : 0 }} />
                        <div style={{ height: `${(d.enviadas / maxFluxo) * 100}%`, background: isToday ? "var(--admin-success)" : "rgba(74, 222, 128, 0.6)", borderRadius: d.devolvidas + d.atrasadas === 0 ? "1px 1px 0 0" : 0, minHeight: d.enviadas > 0 ? 2 : 0 }} />
                      </div>
                    );
                  })}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--admin-text-muted)" }}>
                    <span>{fluxo[0]?.dia.slice(5)}</span>
                    <span>{fluxo[Math.floor(fluxo.length / 2)]?.dia.slice(5)}</span>
                    <span>{fluxo[fluxo.length - 1]?.dia.slice(5)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--admin-success)" }} />
                    Enviadas
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--admin-info-light)" }} />
                    Devueltas
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--admin-danger)" }} />
                    Atrasadas
                  </div>
                </div>
              </div>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            title="Distribución por Estado"
            icon={<BarChart3 size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
          >
            <DonutChart data={donutData} />
          </AdminSectionCard>
        </div>

        {/* Top Revendedoras + Alertas de Prazo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <AdminSectionCard title="Top Revendedoras por Volumen" noPadContent>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Revendedora</th>
                  <th style={{ textAlign: "right" }}>Maletas</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {topRevendedoras.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                      Sin revendedoras en el período
                    </td>
                  </tr>
                ) : topRevendedoras.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: i < 3 ? "var(--admin-purple)" : "var(--admin-text-muted)" }}>
                      {i + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--admin-purple-light)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}>
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            r.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{r.maletasAtivas}</td>
                    <td style={{ textAlign: "right", fontSize: 14 }}>{formatCurrency(r.valorEmMaleta)}</td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: r.statusAtual === "Atrasada" ? "var(--admin-danger-15)" : r.statusAtual === "Ativa" ? "var(--admin-success-10)" : "var(--admin-border)",
                        color: r.statusAtual === "Atrasada" ? "var(--admin-danger)" : r.statusAtual === "Ativa" ? "var(--admin-success)" : "var(--admin-text-muted)",
                      }}>
                        {r.statusAtual}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminSectionCard>

          <AdminSectionCard
            title="Alertas de Prazo (≤7 días)"
            icon={<AlertCircle size={15} color="var(--admin-danger)" strokeWidth={1.5} />}
            noPadContent
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Maleta</th>
                  <th>Revendedora</th>
                  <th>Límite</th>
                  <th>Días</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alertas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                      Ninguna maleta próxima al vencimiento
                    </td>
                  </tr>
                ) : alertas.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700 }}>#{a.numero}</td>
                    <td>{a.revendedoraNome}</td>
                    <td>{formatDatePY(a.dataLimite)}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: a.diasRestantes <= 2 ? "var(--admin-danger)" : "var(--admin-warning)" }}>
                        {a.diasRestantes <= 0 ? "Vencida" : `${a.diasRestantes} rest.`}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/maleta/${a.id}`}
                        style={{ color: "var(--admin-accent)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        Ver <ChevronRight size={12} strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminSectionCard>
        </div>

        {/* Produtos Mais Vendidos */}
        <AdminSectionCard
          title="Productos Más Vendidos"
          icon={<PackageCheck size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
          action={
            <Link
              href="/admin/produtos"
              style={{ fontSize: 12, color: "var(--admin-accent)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              Ver catálogo <ChevronRight size={12} strokeWidth={2} />
            </Link>
          }
          noPadContent
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Producto</th>
                <th style={{ width: "40%" }}>Unidades</th>
                <th style={{ textAlign: "right" }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px 20px", color: "var(--admin-text-muted)" }}>
                    Sin ventas en el período
                  </td>
                </tr>
              ) : produtos.map((p, i) => {
                const maxUn = produtos[0].unidadesVendidas || 1;
                const pct = (p.unidadesVendidas / maxUn) * 100;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--admin-text-muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{p.nome}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--admin-surface-hover)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--admin-accent)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {p.unidadesVendidas} un.
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(p.valorTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminSectionCard>

        {/* Seção Vitrina Pública */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ color: "var(--admin-text)", fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>
              Vitrina Pública
            </span>
            <VitrinaCsvDownload
              csv={csvData}
              filename={`vitrina-${from.toISOString().slice(0, 10).replace(/-/g, "")}-${to.toISOString().slice(0, 10).replace(/-/g, "")}.csv`}
            />
          </div>

          {/* KPI Cards Vitrina */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            <AnalyticsVitrinaKpiCards kpis={vitrinaKPIs} />
          </div>

          {/* Visitas + Ranking */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <AdminSectionCard
              title="Visitas a la Vitrina"
              icon={<TrendingUp size={15} color="var(--admin-accent)" strokeWidth={1.5} />}
            >
              <AnalyticsVisitasChart data={vitrinaSeries} />
            </AdminSectionCard>

            <AdminSectionCard title="Ranking por Engajamento" noPadContent>
              <AnalyticsVitrinaRanking items={vitrinaRanking} />
            </AdminSectionCard>
          </div>
        </div>

      </div>
    </div>
  );
}
