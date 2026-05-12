"use client";

import { useState } from "react";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import {
    FileSpreadsheet,
    FileText,
    Download,
    Package,
    Users,
    Briefcase,
    BarChart3,
    FileDown,
    Loader2,
} from "lucide-react";

interface ExportCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    csv: boolean;
    xlsx: boolean;
    pdf: boolean;
}

const EXPORTS: ExportCard[] = [
    {
        id: "produtos",
        title: "Produtos",
        description: "Lista completa de produtos com SKU, preço, estoque e variantes.",
        icon: <Package className="w-5 h-5 text-blue-500" />,
        csv: true,
        xlsx: true,
        pdf: true,
    },
    {
        id: "revendedoras",
        title: "Revendedoras",
        description: "Lista de revendedoras com comissão, colaboradora vinculada e status.",
        icon: <Users className="w-5 h-5 text-purple-500" />,
        csv: true,
        xlsx: true,
        pdf: true,
    },
    {
        id: "colaboradoras",
        title: "Colaboradoras",
        description: "Lista de colaboradoras com equipas e número de revendedoras.",
        icon: <Users className="w-5 h-5 text-emerald-500" />,
        csv: true,
        xlsx: true,
        pdf: false,
    },
    {
        id: "maletas",
        title: "Maletas",
        description: "Todas as maletas com status, peças, vendas e valores.",
        icon: <Briefcase className="w-5 h-5 text-amber-500" />,
        csv: true,
        xlsx: true,
        pdf: true,
    },
    {
        id: "analytics",
        title: "Analytics (30 dias)",
        description: "Eventos de acesso dos últimos 30 dias com revendedora e tipo.",
        icon: <BarChart3 className="w-5 h-5 text-rose-500" />,
        csv: true,
        xlsx: true,
        pdf: false,
    },
];

export default function RelatoriosPage() {
    const [downloading, setDownloading] = useState<string | null>(null);

    async function handleExport(type: string, format: "csv" | "xlsx" | "pdf") {
        const key = `${type}-${format}`;
        setDownloading(key);

        try {
            const url =
                format === "pdf"
                    ? `/api/export/pdf?type=${type}`
                    : `/api/export?type=${type}&format=${format}`;

            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Erro ao exportar");
                return;
            }

            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);

            // Extract filename from Content-Disposition
            const disposition = res.headers.get("Content-Disposition");
            const match = disposition?.match(/filename="(.+)"/);
            a.download = match?.[1] || `monarca_${type}.${format}`;

            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(a.href);
        } catch {
            alert("Erro ao descarregar ficheiro");
        } finally {
            setDownloading(null);
        }
    }

    return (
        <>
            <AdminTopHeader breadcrumb="Admin" title="Relatórios e Exportação" />
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* PDF Summary Report */}
                <div className="admin-card" style={{ border: "1px solid color-mix(in srgb, var(--admin-accent) 30%, transparent)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: "var(--admin-accent)", color: "white",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--admin-text)", margin: 0 }}>Relatório Geral (PDF)</p>
                                <p style={{ fontSize: 13, color: "var(--admin-text-muted)", margin: 0 }}>
                                    Resumo completo com todas as métricas da Monarca, formatado para impressão.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleExport("resumo", "pdf")}
                            disabled={downloading === "resumo-pdf"}
                            className="admin-btn admin-btn-primary"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                            {downloading === "resumo-pdf" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Descarregar PDF
                        </button>
                    </div>
                </div>

                {/* Export Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                    {EXPORTS.map((exp) => (
                        <div key={exp.id} className="admin-card">
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                {exp.icon}
                                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--admin-text)" }}>{exp.title}</span>
                            </div>
                            <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
                                {exp.description}
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {exp.csv && (
                                    <button
                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                        onClick={() => handleExport(exp.id, "csv")}
                                        disabled={downloading === `${exp.id}-csv`}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                                    >
                                        {downloading === `${exp.id}-csv` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <FileText className="w-3 h-3" />
                                        )}
                                        CSV
                                    </button>
                                )}
                                {exp.xlsx && (
                                    <button
                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                        onClick={() => handleExport(exp.id, "xlsx")}
                                        disabled={downloading === `${exp.id}-xlsx`}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                                    >
                                        {downloading === `${exp.id}-xlsx` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="w-3 h-3" />
                                        )}
                                        Excel
                                    </button>
                                )}
                                {exp.pdf && (
                                    <button
                                        className="admin-btn admin-btn-secondary admin-btn-sm"
                                        onClick={() => handleExport(exp.id, "pdf")}
                                        disabled={downloading === `${exp.id}-pdf`}
                                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                                    >
                                        {downloading === `${exp.id}-pdf` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <FileDown className="w-3 h-3" />
                                        )}
                                        PDF
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
