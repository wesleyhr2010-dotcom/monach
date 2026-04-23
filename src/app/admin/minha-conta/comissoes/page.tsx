"use client";

import { useState, useEffect } from "react";
import { getExtratoComissoes } from "./actions";
import { formatGs } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ChevronDown, ChevronUp } from "lucide-react";

export const dynamic = "force-dynamic";

interface DetalheMes {
    numero: number;
    revendedora: string;
    vendas: number;
    comissao: number;
    pct: number;
}

interface MesExtrato {
    mes: string;
    faturamento: number;
    comissao: number;
    maletas: number;
    detalhes: DetalheMes[];
}

export default function ExtratoComissoesPage() {
    const [ano, setAno] = useState(new Date().getFullYear());
    const [data, setData] = useState<{ totalAno: number; extrato: MesExtrato[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedMes, setExpandedMes] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const result = await getExtratoComissoes(ano);
            setData(result);
            setLoading(false);
        }
        load();
    }, [ano]);

    return (
        <div className="admin-page">
            <AdminPageHeader
                title="Extrato de Comissões"
                breadcrumb="Minha Conta"
                backHref="/admin/minha-conta"
            />

            {/* Filtro de ano */}
            <div className="flex items-center gap-3 mt-4">
                <label className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    Año:
                </label>
                <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="admin-select"
                >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>
            </div>

            {/* Resumo do ano */}
            {data && (
                <div
                    className="admin-card mt-4 flex items-center justify-between"
                >
                    <div>
                        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--admin-text-dim)" }}>
                            Total ganho en {ano}
                        </p>
                        <p
                            className="text-2xl font-bold"
                            style={{ fontFamily: "'Playfair Display', system-ui, sans-serif", color: "var(--admin-primary)" }}
                        >
                            {formatGs(data.totalAno)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
                            {data.extrato.reduce((s, m) => s + m.maletas, 0)} maletas cerradas
                        </p>
                    </div>
                </div>
            )}

            {/* Tabela por mês */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35605A]" />
                    </div>
                ) : !data || data.extrato.length === 0 ? (
                    <div className="admin-empty-state">
                        <p style={{ color: "var(--admin-text-muted)" }}>
                            No hay comisiones registradas para {ano}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {data.extrato.map((mes) => {
                            const isExpanded = expandedMes === mes.mes;
                            return (
                                <div
                                    key={mes.mes}
                                    className="admin-card"
                                    style={{ padding: 0, overflow: "hidden" }}
                                >
                                    {/* Header do mês */}
                                    <button
                                        onClick={() => setExpandedMes(isExpanded ? null : mes.mes)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronUp size={18} style={{ color: "var(--admin-text-muted)" }} />
                                            ) : (
                                                <ChevronDown size={18} style={{ color: "var(--admin-text-muted)" }} />
                                            )}
                                            <span className="font-semibold text-sm">{mes.mes}</span>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <span style={{ color: "var(--admin-text-muted)" }}>
                                                Fat.: {formatGs(mes.faturamento)}
                                            </span>
                                            <span
                                                className="font-semibold"
                                                style={{ color: "var(--admin-primary)" }}
                                            >
                                                {formatGs(mes.comissao)}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Detalhes expandíveis */}
                                    {isExpanded && (
                                        <div
                                            style={{
                                                borderTop: "1px solid var(--admin-border)",
                                                padding: "12px 16px",
                                            }}
                                        >
                                            <table className="admin-table w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left text-xs">Revendedora</th>
                                                        <th className="text-left text-xs">Maleta</th>
                                                        <th className="text-right text-xs">Vendas</th>
                                                        <th className="text-right text-xs">Comissión</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mes.detalhes.map((d) => (
                                                        <tr key={`${d.numero}-${d.revendedora}`}>
                                                            <td className="text-sm">{d.revendedora}</td>
                                                            <td className="text-sm text-muted">#{d.numero}</td>
                                                            <td className="text-sm text-right">
                                                                {formatGs(d.vendas)}
                                                            </td>
                                                            <td
                                                                className="text-sm text-right font-medium"
                                                                style={{ color: "var(--admin-primary)" }}
                                                            >
                                                                {formatGs(d.comissao)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr style={{ borderTop: "1px solid var(--admin-border)" }}>
                                                        <td colSpan={2} className="text-xs font-semibold">
                                                            TOTAL
                                                        </td>
                                                        <td className="text-xs text-right font-semibold">
                                                            {formatGs(mes.faturamento)}
                                                        </td>
                                                        <td
                                                            className="text-xs text-right font-semibold"
                                                            style={{ color: "var(--admin-primary)" }}
                                                        >
                                                            {formatGs(mes.comissao)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
