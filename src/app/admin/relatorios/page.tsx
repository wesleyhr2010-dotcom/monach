"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
            <header className="admin-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <FileDown className="w-6 h-6" />
                    <div>
                        <h1>Relatórios e Exportação</h1>
                        <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                            CSV, Excel e PDF
                        </p>
                    </div>
                </div>
            </header>

            <div className="admin-content">
                {/* PDF Summary Report */}
                <Card style={{ marginBottom: "24px", border: "1px solid #35605a22" }}>
                    <CardContent className="pt-6">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: "#35605a", color: "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: "15px" }}>Relatório Geral (PDF)</p>
                                    <p style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                                        Resumo completo com todas as métricas da Monarca, formatado para impressão.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleExport("resumo", "pdf")}
                                disabled={downloading === "resumo-pdf"}
                                style={{ background: "#35605a" }}
                            >
                                {downloading === "resumo-pdf" ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Descarregar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                    {EXPORTS.map((exp) => (
                        <Card key={exp.id}>
                            <CardHeader className="pb-3">
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {exp.icon}
                                    <CardTitle style={{ fontSize: "15px" }}>{exp.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
                                    {exp.description}
                                </p>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {exp.csv && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExport(exp.id, "csv")}
                                            disabled={downloading === `${exp.id}-csv`}
                                            style={{ fontSize: "12px" }}
                                        >
                                            {downloading === `${exp.id}-csv` ? (
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <FileText className="w-3 h-3 mr-1" />
                                            )}
                                            CSV
                                        </Button>
                                    )}
                                    {exp.xlsx && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExport(exp.id, "xlsx")}
                                            disabled={downloading === `${exp.id}-xlsx`}
                                            style={{ fontSize: "12px" }}
                                        >
                                            {downloading === `${exp.id}-xlsx` ? (
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="w-3 h-3 mr-1" />
                                            )}
                                            Excel
                                        </Button>
                                    )}
                                    {exp.pdf && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExport(exp.id, "pdf")}
                                            disabled={downloading === `${exp.id}-pdf`}
                                            style={{ fontSize: "12px" }}
                                        >
                                            {downloading === `${exp.id}-pdf` ? (
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <FileDown className="w-3 h-3 mr-1" />
                                            )}
                                            PDF
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
