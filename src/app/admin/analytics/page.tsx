import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAnalyticsKPIs,
  getAnalyticsFluxoMaletas,
  getAnalyticsDistribuicaoStatus,
  getAnalyticsTopRevendedoras,
  getAnalyticsAlertasPrazo,
  getAnalyticsProdutosMaisVendidos,
} from "../actions-analytics";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnalyticsKpiCards } from "./AnalyticsKpiCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
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
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const periodParam = params.period || "30";
  const periodDays = parseInt(periodParam, 10);

  if (!PERIOD_OPTIONS.some((o) => o.days === periodDays)) {
    redirect("/admin/analytics?period=30");
  }

  const [kpis, fluxo, distribuicao, topRevendedoras, alertas, produtos] = await Promise.all([
    getAnalyticsKPIs(periodDays),
    getAnalyticsFluxoMaletas(periodDays),
    getAnalyticsDistribuicaoStatus(),
    getAnalyticsTopRevendedoras(periodDays, 10),
    getAnalyticsAlertasPrazo(),
    getAnalyticsProdutosMaisVendidos(periodDays, 10),
  ]);

  const statusColorMap: Record<string, string> = {
    ativa: "#4ADE80",
    atrasada: "#E05C5C",
    aguardando_revisao: "#FACC15",
    concluida: "#60A5FA",
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
    <>
      <AdminPageHeader
        title="Analytics"
        description="Métricas operacionales de maletas y revendedoras"
        action={
          <div style={{ display: "flex", gap: "6px" }}>
            {PERIOD_OPTIONS.map((opt) => (
              <Link
                key={opt.days}
                href={`/admin/analytics?period=${opt.days}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  periodDays === opt.days
                    ? "bg-[#35605A] text-white"
                    : "bg-[#1a1a1a] text-[#888] hover:text-white border border-[#333]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="admin-content">
        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <AnalyticsKpiCards kpis={kpis} />
        </div>

        {/* Gráficos: Fluxo + Distribuição */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Fluxo de Maletas */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp className="w-4 h-4 text-[#35605A]" />
                Fluxo de Maletas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fluxo.length === 0 || fluxo.every((d) => d.enviadas + d.devolvidas + d.atrasadas === 0) ? (
                <p style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "40px 0" }}>
                  Sin datos en el período
                </p>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "3px",
                      height: "180px",
                      paddingBottom: "24px",
                      position: "relative",
                    }}
                  >
                    {fluxo.map((d, i) => {
                      const isToday = i === fluxo.length - 1;
                      return (
                        <div
                          key={d.dia}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            height: "100%",
                            position: "relative",
                            gap: "1px",
                          }}
                          title={`${d.dia}: E=${d.enviadas} D=${d.devolvidas} A=${d.atrasadas}`}
                        >
                          <div
                            style={{
                              height: `${(d.atrasadas / maxFluxo) * 100}%`,
                              background: isToday ? "#E05C5C" : "#E05C5C99",
                              borderRadius: "1px 1px 0 0",
                              minHeight: d.atrasadas > 0 ? "2px" : "0",
                            }}
                          />
                          <div
                            style={{
                              height: `${(d.devolvidas / maxFluxo) * 100}%`,
                              background: isToday ? "#60A5FA" : "#60A5FA99",
                              minHeight: d.devolvidas > 0 ? "2px" : "0",
                            }}
                          />
                          <div
                            style={{
                              height: `${(d.enviadas / maxFluxo) * 100}%`,
                              background: isToday ? "#4ADE80" : "#4ADE8099",
                              borderRadius: d.devolvidas + d.atrasadas === 0 ? "1px 1px 0 0" : "0",
                              minHeight: d.enviadas > 0 ? "2px" : "0",
                            }}
                          />
                        </div>
                      );
                    })}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "10px",
                        color: "var(--admin-text-muted)",
                      }}
                    >
                      <span>{fluxo[0]?.dia.slice(5)}</span>
                      <span>{fluxo[Math.floor(fluxo.length / 2)]?.dia.slice(5)}</span>
                      <span>{fluxo[fluxo.length - 1]?.dia.slice(5)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "20px", marginTop: "12px", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: "#4ADE80" }} />
                      Enviadas
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: "#60A5FA" }} />
                      Devueltas
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: "#E05C5C" }} />
                      Atrasadas
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição por Status */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 className="w-4 h-4 text-[#35605A]" />
                Distribución por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={donutData} />
            </CardContent>
          </Card>
        </div>

        {/* Top Revendedoras + Alertas de Prazo */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Top Revendedoras */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: "16px" }}>Top Revendedoras por Volumen</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topRevendedoras.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-text-muted)" }}>
                  Sin revendedoras en el período
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: "40px" }}>#</TableHead>
                      <TableHead>Revendedora</TableHead>
                      <TableHead style={{ textAlign: "right" }}>Maletas</TableHead>
                      <TableHead style={{ textAlign: "right" }}>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topRevendedoras.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell style={{ fontWeight: 600, color: i < 3 ? "#8b5cf6" : "var(--admin-text-muted)" }}>
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "#a855f7",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 600,
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {r.avatar_url ? (
                                <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                r.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span style={{ fontWeight: 500, fontSize: "14px" }}>{r.name}</span>
                          </div>
                        </TableCell>
                        <TableCell style={{ textAlign: "right", fontWeight: 600 }}>{r.maletasAtivas}</TableCell>
                        <TableCell style={{ textAlign: "right", fontSize: "14px" }}>
                          {formatCurrency(r.valorEmMaleta)}
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background:
                                r.statusAtual === "Atrasada"
                                  ? "#E05C5C26"
                                  : r.statusAtual === "Ativa"
                                  ? "#4ADE801A"
                                  : "#333",
                              color:
                                r.statusAtual === "Atrasada"
                                  ? "#E05C5C"
                                  : r.statusAtual === "Ativa"
                                  ? "#4ADE80"
                                  : "#888",
                            }}
                          >
                            {r.statusAtual}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Alertas de Prazo */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle className="w-4 h-4 text-[#E05C5C]" />
                Alertas de Prazo (≤7 días)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {alertas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-text-muted)" }}>
                  Ninguna maleta próxima al vencimiento
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maleta</TableHead>
                      <TableHead>Revendedora</TableHead>
                      <TableHead>Límite</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertas.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell style={{ fontWeight: 700 }}>#{a.numero}</TableCell>
                        <TableCell>{a.revendedoraNome}</TableCell>
                        <TableCell>{formatDatePY(a.dataLimite)}</TableCell>
                        <TableCell>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: a.diasRestantes <= 2 ? "#E05C5C" : "#FACC15",
                            }}
                          >
                            {a.diasRestantes <= 0 ? "Vencida" : `${a.diasRestantes} rest.`}
                          </span>
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <Link
                            href={`/admin/maleta/${a.id}`}
                            style={{ color: "#35605A", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            Ver <ChevronRight className="w-3 h-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Produtos Mais Vendidos */}
        <Card style={{ marginBottom: "32px" }}>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <CardTitle style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <PackageCheck className="w-4 h-4 text-[#35605A]" />
                Productos Más Vendidos
              </CardTitle>
              <Link
                href="/admin/produtos"
                style={{ fontSize: "12px", color: "#35605A", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                Ver catálogo <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {produtos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-text-muted)" }}>
                Sin ventas en el período
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "50px" }}>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead style={{ width: "40%" }}>Unidades</TableHead>
                    <TableHead style={{ textAlign: "right" }}>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((p, i) => {
                    const maxUn = produtos[0].unidadesVendidas || 1;
                    const pct = (p.unidadesVendidas / maxUn) * 100;
                    return (
                      <TableRow key={p.id}>
                        <TableCell style={{ fontWeight: 600, color: "var(--admin-text-muted)" }}>{i + 1}</TableCell>
                        <TableCell style={{ fontWeight: 500 }}>{p.nome}</TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ flex: 1, height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: "#35605A",
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {p.unidadesVendidas} un.
                            </span>
                          </div>
                        </TableCell>
                        <TableCell style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrency(p.valorTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
