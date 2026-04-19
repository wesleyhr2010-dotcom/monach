import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get("type") || "resumo";

    try {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const today = new Date().toISOString().slice(0, 10);
        let filename = "";

        // Header
        doc.setFontSize(18);
        doc.setTextColor(53, 96, 90);
        doc.text("Monarca Semijoyas", 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);

        switch (type) {
            case "resumo": {
                doc.text(`Relatório Geral — ${today}`, 14, 26);
                filename = `relatorio_geral_${today}`;

                const prodCount = await prisma.product.count();
                const revendCount = await prisma.reseller.count({ where: { role: "REVENDEDORA" } });
                const revendActive = await prisma.reseller.count({ where: { role: "REVENDEDORA", is_active: true } });
                const colabCount = await prisma.reseller.count({ where: { role: "COLABORADORA" } });
                const maletaCount = await prisma.maleta.count();
                const maletaAtiva = await prisma.maleta.count({ where: { status: "ativa" } });

                const since30 = new Date();
                since30.setDate(since30.getDate() - 30);
                const analyticsCount = await prisma.analyticsAcesso.count({
                    where: { data_acesso: { gte: since30 }, is_bot: false },
                });

                autoTable(doc, {
                    startY: 32,
                    head: [["Métrica", "Valor"]],
                    body: [
                        ["Total de Produtos", String(prodCount)],
                        ["Total de Revendedoras", String(revendCount)],
                        ["Revendedoras Ativas", String(revendActive)],
                        ["Total de Colaboradoras", String(colabCount)],
                        ["Total de Maletas", String(maletaCount)],
                        ["Maletas Ativas", String(maletaAtiva)],
                        ["Visitas (últimos 30 dias)", String(analyticsCount)],
                    ],
                    headStyles: {
                        fillColor: [53, 96, 90],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                    },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    styles: { fontSize: 11 },
                    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: "right" } },
                });
                break;
            }

            case "produtos": {
                doc.text(`Relatório de Produtos — ${today}`, 14, 26);
                filename = `relatorio_produtos_${today}`;

                const products = await prisma.product.findMany({
                    include: { variants: true },
                    orderBy: { name: "asc" },
                });

                autoTable(doc, {
                    startY: 32,
                    head: [["Nome", "SKU", "Preço", "Estoque", "Variantes"]],
                    body: products.map((p) => [
                        p.name,
                        p.sku || "—",
                        `₲ ${Number(p.price || 0).toLocaleString("es-PY")}`,
                        String(p.variants.reduce((s: number, v) => s + v.stock_quantity, 0)),
                        String(p.variants.length),
                    ]),
                    headStyles: {
                        fillColor: [53, 96, 90],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                    },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    styles: { fontSize: 9 },
                });
                break;
            }

            case "revendedoras": {
                doc.text(`Relatório de Revendedoras — ${today}`, 14, 26);
                filename = `relatorio_revendedoras_${today}`;

                const resellers = await prisma.reseller.findMany({
                    where: { role: "REVENDEDORA" },
                    include: { colaboradora: { select: { name: true } } },
                    orderBy: { name: "asc" },
                });

                autoTable(doc, {
                    startY: 32,
                    head: [["Nome", "WhatsApp", "Email", "Comissão %", "Colaboradora", "Ativa"]],
                    body: resellers.map((r) => [
                        r.name,
                        r.whatsapp,
                        r.email || "—",
                        `${r.taxa_comissao}%`,
                        r.colaboradora?.name || "—",
                        r.is_active ? "Sim" : "Não",
                    ]),
                    headStyles: {
                        fillColor: [53, 96, 90],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                    },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    styles: { fontSize: 9 },
                });
                break;
            }

            case "maletas": {
                doc.text(`Relatório de Maletas — ${today}`, 14, 26);
                filename = `relatorio_maletas_${today}`;

                const maletas = await prisma.maleta.findMany({
                    include: {
                        reseller: { select: { name: true } },
                        itens: { select: { quantidade_enviada: true, preco_fixado: true, quantidade_vendida: true } },
                    },
                    orderBy: { created_at: "desc" },
                });

                autoTable(doc, {
                    startY: 32,
                    head: [["ID", "Revendedora", "Status", "Peças", "Vendidas", "Valor Total", "Valor Vendido"]],
                    body: maletas.map((m) => [
                        m.id.slice(0, 8),
                        m.reseller?.name || "—",
                        m.status,
                        String(m.itens.reduce((s: number, i) => s + i.quantidade_enviada, 0)),
                        String(m.itens.reduce((s: number, i) => s + i.quantidade_vendida, 0)),
                        `₲ ${m.itens.reduce((s: number, i) => s + Number(i.preco_fixado || 0) * i.quantidade_enviada, 0).toLocaleString("es-PY")}`,
                        `₲ ${m.itens.reduce((s: number, i) => s + Number(i.preco_fixado || 0) * i.quantidade_vendida, 0).toLocaleString("es-PY")}`,
                    ]),
                    headStyles: {
                        fillColor: [53, 96, 90],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                    },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    styles: { fontSize: 9 },
                });
                break;
            }

            default:
                return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(160, 160, 160);
            doc.text(
                `Monarca Semijoyas — Gerado em ${today} — Página ${i}/${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 8,
                { align: "center" }
            );
        }

        const pdfBuffer = doc.output("arraybuffer");

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="monarca_${filename}.pdf"`,
            },
        });
    } catch (err) {
        console.error("[Export PDF] Error:", err);
        return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
    }
}
