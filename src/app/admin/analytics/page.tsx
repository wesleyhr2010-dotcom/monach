"use client";

import { useState, useEffect } from "react";
import {
    getAnalyticsSummary,
    getAnalyticsByDay,
    getTopRevendedorasByAccess,
} from "../actions-analytics";
import type { AnalyticsSummary, DailyData, TopRevendedora } from "../actions-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Eye, Users, Globe, TrendingUp, User } from "lucide-react";

export default function AnalyticsPage() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [daily, setDaily] = useState<DailyData[]>([]);
    const [topRevend, setTopRevend] = useState<TopRevendedora[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState<"views" | "unicos">("views");

    useEffect(() => {
        async function load() {
            const [s, d, t] = await Promise.all([
                getAnalyticsSummary(),
                getAnalyticsByDay(30),
                getTopRevendedorasByAccess(10),
            ]);
            setSummary(s);
            setDaily(d);
            setTopRevend(t);
            setLoading(false);
        }
        load();
    }, []);

    const maxDailyValue = Math.max(
        ...daily.map((d) =>
            chartMode === "views"
                ? d.diretas + d.revendedoras
                : d.unicos_diretas + d.unicos_revendedoras
        ),
        1
    );

    if (loading) {
        return (
            <>
                <header className="admin-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <BarChart3 className="w-6 h-6" />
                        <div>
                            <h1>Analytics</h1>
                            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                                Carregando dados...
                            </p>
                        </div>
                    </div>
                </header>
                <div className="admin-content">
                    <div style={{ textAlign: "center", padding: "80px 0", color: "var(--admin-text-muted)" }}>
                        Carregando métricas...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <BarChart3 className="w-6 h-6" />
                    <div>
                        <h1>Analytics</h1>
                        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                            Métricas de acesso e tráfego
                        </p>
                    </div>
                </div>
            </header>

            <div className="admin-content">
                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                    {/* Hoje */}
                    <Card>
                        <CardContent className="pt-6">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>Hoje</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                                <p style={{ fontSize: "28px", fontWeight: 700 }}>{summary?.hoje.total || 0}</p>
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>page views</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                <User className="w-3.5 h-3.5 text-emerald-500" />
                                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--admin-text)" }}>
                                    {summary?.hoje.unicos || 0}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>únicos</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Badge variant="outline" style={{ fontSize: "11px" }}>
                                    <Globe className="w-3 h-3 mr-1" /> {summary?.hoje.diretas || 0} dir. ({summary?.hoje.unicos_diretas || 0} ún.)
                                </Badge>
                                <Badge variant="secondary" style={{ fontSize: "11px" }}>
                                    <Users className="w-3 h-3 mr-1" /> {summary?.hoje.revendedoras || 0} rev. ({summary?.hoje.unicos_revendedoras || 0} ún.)
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Semana */}
                    <Card>
                        <CardContent className="pt-6">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>Esta Semana</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                                <p style={{ fontSize: "28px", fontWeight: 700 }}>{summary?.semana.total || 0}</p>
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>page views</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                <User className="w-3.5 h-3.5 text-emerald-500" />
                                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--admin-text)" }}>
                                    {summary?.semana.unicos || 0}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>únicos</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Badge variant="outline" style={{ fontSize: "11px" }}>
                                    <Globe className="w-3 h-3 mr-1" /> {summary?.semana.diretas || 0} dir. ({summary?.semana.unicos_diretas || 0} ún.)
                                </Badge>
                                <Badge variant="secondary" style={{ fontSize: "11px" }}>
                                    <Users className="w-3 h-3 mr-1" /> {summary?.semana.revendedoras || 0} rev. ({summary?.semana.unicos_revendedoras || 0} ún.)
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mês */}
                    <Card>
                        <CardContent className="pt-6">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                <BarChart3 className="w-4 h-4 text-purple-500" />
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>Este Mês</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                                <p style={{ fontSize: "28px", fontWeight: 700 }}>{summary?.mes.total || 0}</p>
                                <span style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>page views</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                <User className="w-3.5 h-3.5 text-emerald-500" />
                                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--admin-text)" }}>
                                    {summary?.mes.unicos || 0}
                                </span>
                                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>únicos</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Badge variant="outline" style={{ fontSize: "11px" }}>
                                    <Globe className="w-3 h-3 mr-1" /> {summary?.mes.diretas || 0} dir. ({summary?.mes.unicos_diretas || 0} ún.)
                                </Badge>
                                <Badge variant="secondary" style={{ fontSize: "11px" }}>
                                    <Users className="w-3 h-3 mr-1" /> {summary?.mes.revendedoras || 0} rev. ({summary?.mes.unicos_revendedoras || 0} ún.)
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Chart */}
                <Card style={{ marginBottom: "32px" }}>
                    <CardHeader>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                            <CardTitle style={{ fontSize: "16px" }}>Tráfego — Últimos 30 dias</CardTitle>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <Button
                                    variant={chartMode === "views" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setChartMode("views")}
                                    style={{ fontSize: "12px" }}
                                >
                                    <Eye className="w-3 h-3 mr-1" /> Page Views
                                </Button>
                                <Button
                                    variant={chartMode === "unicos" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setChartMode("unicos")}
                                    style={{ fontSize: "12px" }}
                                >
                                    <User className="w-3 h-3 mr-1" /> Únicos
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {daily.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--admin-text-muted)", padding: "40px 0" }}>
                                Sem dados ainda
                            </p>
                        ) : (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "200px", paddingBottom: "24px", position: "relative" }}>
                                {daily.map((d, i) => {
                                    const valDir = chartMode === "views" ? d.diretas : d.unicos_diretas;
                                    const valRev = chartMode === "views" ? d.revendedoras : d.unicos_revendedoras;
                                    const total = valDir + valRev;
                                    const heightPct = (total / maxDailyValue) * 100;
                                    const diretasPct = total > 0 ? (valDir / total) * heightPct : 0;
                                    const revendPct = total > 0 ? (valRev / total) * heightPct : 0;
                                    const isToday = i === daily.length - 1;

                                    return (
                                        <div
                                            key={d.date}
                                            style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}
                                            title={`${d.date}: ${valDir} diretas, ${valRev} revendedoras (${chartMode === "unicos" ? "únicos" : "views"})`}
                                        >
                                            <div style={{
                                                height: `${revendPct}%`,
                                                background: isToday ? "#8b5cf6" : "#c4b5fd",
                                                borderRadius: "2px 2px 0 0",
                                                minHeight: revendPct > 0 ? "2px" : "0",
                                            }} />
                                            <div style={{
                                                height: `${diretasPct}%`,
                                                background: isToday ? "#3b82f6" : "#93c5fd",
                                                borderRadius: revendPct > 0 ? "0" : "2px 2px 0 0",
                                                minHeight: diretasPct > 0 ? "2px" : "0",
                                            }} />
                                        </div>
                                    );
                                })}
                                <div style={{
                                    position: "absolute", bottom: "0", left: 0, right: 0,
                                    display: "flex", justifyContent: "space-between",
                                    fontSize: "10px", color: "var(--admin-text-muted)",
                                }}>
                                    <span>{daily[0]?.date.slice(5)}</span>
                                    <span>{daily[Math.floor(daily.length / 2)]?.date.slice(5)}</span>
                                    <span>{daily[daily.length - 1]?.date.slice(5)}</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "20px", marginTop: "12px", justifyContent: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#3b82f6" }} />
                                Visitas Diretas
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#8b5cf6" }} />
                                Via Revendedoras
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Revendedoras */}
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: "16px" }}>Top Revendedoras por Acessos (30 dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topRevend.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--admin-text-muted)" }}>
                                Sem dados de revendedoras ainda
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead style={{ width: "40px" }}>#</TableHead>
                                        <TableHead>Revendedora</TableHead>
                                        <TableHead style={{ textAlign: "right" }}>Visitas</TableHead>
                                        <TableHead style={{ textAlign: "right" }}>Únicos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topRevend.map((r, i) => (
                                        <TableRow key={r.id}>
                                            <TableCell style={{ fontWeight: 600, color: i < 3 ? "#8b5cf6" : "var(--admin-text-muted)" }}>
                                                {i + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: "50%",
                                                        background: "#a855f7", color: "white",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: "13px", fontWeight: 600,
                                                        overflow: "hidden", flexShrink: 0,
                                                    }}>
                                                        {r.avatar_url ? (
                                                            <img src={r.avatar_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        ) : (
                                                            r.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <span style={{ fontWeight: 500, fontSize: "14px" }}>{r.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell style={{ textAlign: "right", fontWeight: 600, fontSize: "15px" }}>
                                                {r.total_visitas.toLocaleString()}
                                            </TableCell>
                                            <TableCell style={{ textAlign: "right", fontSize: "14px", color: "var(--admin-text-muted)" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                                                    <User className="w-3 h-3" />
                                                    {r.visitantes_unicos.toLocaleString()}
                                                </div>
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
