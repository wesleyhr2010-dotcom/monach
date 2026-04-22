import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
    const format = request.nextUrl.searchParams.get("format") || "csv";
    const type = request.nextUrl.searchParams.get("type") || "produtos";

    try {
        let data: Record<string, unknown>[] = [];
        let filename = "";

        switch (type) {
            case "produtos": {
                const products = await prisma.product.findMany({
                    include: {
                        variants: true,
                        categories: { include: { category: true } },
                    },
                    orderBy: { created_at: "desc" },
                });
                data = products.map((p) => ({
                    Nome: p.name,
                    SKU: p.sku || "",
                    Preço: Number(p.price || 0),
                    Categorias: p.categories.map((c) => c.category.name).join(", "),
                    Estoque: p.variants.reduce((sum: number, v) => sum + v.stock_quantity, 0),
                    Variantes: p.variants.length,
                    Criado: p.created_at?.toISOString().slice(0, 10) || "",
                }));
                filename = "produtos";
                break;
            }

            case "revendedoras": {
                const resellers = await prisma.reseller.findMany({
                    where: { role: "REVENDEDORA" },
                    include: { colaboradora: { select: { name: true } } },
                    orderBy: { created_at: "desc" },
                });
                data = resellers.map((r) => ({
                    Nome: r.name,
                    WhatsApp: r.whatsapp,
                    Email: r.email || "",
                    "Comissão %": Number(r.taxa_comissao),
                    Colaboradora: r.colaboradora?.name || "—",
                    Ativa: r.is_active ? "Sim" : "Não",
                    Criada: r.created_at?.toISOString().slice(0, 10) || "",
                }));
                filename = "revendedoras";
                break;
            }

            case "colaboradoras": {
                const colabs = await prisma.reseller.findMany({
                    where: { role: "COLABORADORA" },
                    include: { revendedoras_sob_mim: { select: { id: true } } },
                    orderBy: { created_at: "desc" },
                });
                data = colabs.map((c) => ({
                    Nome: c.name,
                    WhatsApp: c.whatsapp,
                    Email: c.email || "",
                    "Comissão %": Number(c.taxa_comissao),
                    Revendedoras: c.revendedoras_sob_mim.length,
                    Ativa: c.is_active ? "Sim" : "Não",
                    Criada: c.created_at?.toISOString().slice(0, 10) || "",
                }));
                filename = "colaboradoras";
                break;
            }

            case "maletas": {
                const maletas = await prisma.maleta.findMany({
                    include: {
                        reseller: { select: { name: true } },
                        itens: { select: { quantidade_enviada: true, preco_fixado: true, quantidade_vendida: true } },
                    },
                    orderBy: { created_at: "desc" },
                });
                data = maletas.map((m) => ({
                    ID: m.id.slice(0, 8),
                    Revendedora: m.reseller?.name || "—",
                    Status: m.status,
                    "Total Peças": m.itens.reduce((s: number, i) => s + i.quantidade_enviada, 0),
                    "Peças Vendidas": m.itens.reduce((s: number, i) => s + i.quantidade_vendida, 0),
                    "Valor Total": m.itens.reduce((s: number, i) => s + Number(i.preco_fixado || 0) * i.quantidade_enviada, 0),
                    "Valor Vendido": m.itens.reduce((s: number, i) => s + Number(i.preco_fixado || 0) * i.quantidade_vendida, 0),
                    "Data Envio": m.data_envio?.toISOString().slice(0, 10) || "",
                    "Data Limite": m.data_limite?.toISOString().slice(0, 10) || "",
                    Criada: m.created_at?.toISOString().slice(0, 10) || "",
                }));
                filename = "maletas";
                break;
            }

            case "analytics": {
                const since = new Date();
                since.setDate(since.getDate() - 30);
                const events = await prisma.analyticsAcesso.findMany({
                    where: { data_acesso: { gte: since }, is_bot: false },
                    include: { reseller: { select: { name: true } } },
                    orderBy: { data_acesso: "desc" },
                    take: 5000,
                });
                data = events.map((e) => ({
                    Data: e.data_acesso.toISOString().slice(0, 19).replace("T", " "),
                    Evento: e.tipo_evento,
                    URL: e.page_url,
                    Revendedora: e.reseller?.name || "Direto",
                    "Visitor ID": e.visitor_id?.slice(0, 8) || "",
                }));
                filename = "analytics_30dias";
                break;
            }

            default:
                return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
        }

        if (data.length === 0) {
            return NextResponse.json({ error: "Sem dados para exportar" }, { status: 404 });
        }

        const today = new Date().toISOString().slice(0, 10);

        if (format === "xlsx") {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            const colWidths = Object.keys(data[0]).map((key) => ({
                wch: Math.max(
                    key.length,
                    ...data.map((row) => String(row[key] ?? "").length)
                ) + 2,
            }));
            ws["!cols"] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, filename);
            const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="monarca_${filename}_${today}.xlsx"`,
                },
            });
        }

        // CSV
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";", RS: "\n" });

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="monarca_${filename}_${today}.csv"`,
            },
        });
    } catch (err: unknown) {
        console.error("[Export] Error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Erro ao exportar" }, { status: 500 });
    }
}
