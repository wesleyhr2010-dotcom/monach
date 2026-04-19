"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

export async function getDashboardCompleto() {
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    if (!user || !user.profileId) {
        throw new Error("Não autorizado");
    }

    const resellerId = user.profileId;
    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: { name: true, taxa_comissao: true },
    });

    const maletas = await prisma.maleta.findMany({
        where: { reseller_id: resellerId },
        include: {
            itens: {
                include: {
                    vendas: true
                }
            }
        },
        orderBy: { created_at: "desc" },
    });

    let totalVendido = 0;
    let totalPecas = 0;

    maletas.forEach(maleta => {
        maleta.itens.forEach(item => {
            totalPecas += item.quantidade_vendida;
            item.vendas.forEach(venda => {
                totalVendido += Number(venda.preco_unitario) * venda.quantidade;
            });
        });
    });

    const comissaoPct = Number(reseller?.taxa_comissao || 0);
    const comissaoValor = totalVendido * (comissaoPct / 100);

    const historicoMaletas = maletas.map(m => ({
        id: m.id,
        status: m.status,
        data_limite: m.data_limite,
        totalItens: m.itens.reduce((acc, item) => acc + item.quantidade_enviada, 0),
        vendidos: m.itens.reduce((acc, item) => acc + item.quantidade_vendida, 0)
    }));

    return {
        nome: reseller?.name || "Revendedora",
        nivel: "Iniciante",
        xpTotal: 0,
        totalVendido,
        comissaoValor,
        totalPecas,
        historicoMaletas,
    };
}

// ============================================
// Get active maleta for a reseller
// ============================================
export async function getMinhasMaletas(resellerId: string) {
    const maletas = await prisma.maleta.findMany({
        where: { reseller_id: resellerId },
        include: {
            itens: {
                include: {
                    product_variant: {
                        include: {
                            product: { select: { id: true, name: true, images: true, price: true } },
                        },
                    },
                },
            },
        },
        orderBy: { created_at: "desc" },
    });
    return maletas;
}

// ============================================
// Register a sale with multiple items
// ============================================
export async function registrarVendaMultipla(data: {
    cliente_nome: string;
    cliente_telefone: string;
    itens: Array<{ maleta_item_id: string; quantidade: number }>;
}) {
    // Validate all items first
    const items = await prisma.maletaItem.findMany({
        where: { id: { in: data.itens.map((i) => i.maleta_item_id) } },
    });

    for (const cartItem of data.itens) {
        const dbItem = items.find((i) => i.id === cartItem.maleta_item_id);
        if (!dbItem) throw new Error("Item não encontrado");
        const disponivel = dbItem.quantidade_enviada - dbItem.quantidade_vendida;
        if (cartItem.quantidade > disponivel) {
            throw new Error(`Apenas ${disponivel} peça(s) disponível(is) para um dos itens`);
        }
    }

    // Create all sales + update stock in a single transaction
    const operations = data.itens.flatMap((cartItem) => {
        const dbItem = items.find((i) => i.id === cartItem.maleta_item_id)!;
        return [
            prisma.vendaMaleta.create({
                data: {
                    maleta_item_id: cartItem.maleta_item_id,
                    cliente_nome: data.cliente_nome,
                    cliente_telefone: data.cliente_telefone,
                    quantidade: cartItem.quantidade,
                    preco_unitario: dbItem.preco_fixado || 0,
                },
            }),
            prisma.maletaItem.update({
                where: { id: cartItem.maleta_item_id },
                data: { quantidade_vendida: { increment: cartItem.quantidade } },
            }),
        ];
    });

    await prisma.$transaction(operations);
    return { success: true };
}

// ============================================
// Get all sales for a reseller
// ============================================
export async function getMinhasVendas(resellerId: string) {
    const vendas = await prisma.vendaMaleta.findMany({
        where: {
            maleta_item: {
                maleta: { reseller_id: resellerId },
            },
        },
        include: {
            maleta_item: {
                include: {
                    product_variant: {
                        include: {
                            product: { select: { name: true, images: true } },
                        },
                    },
                },
            },
        },
        orderBy: { created_at: "desc" },
    });
    return vendas;
}

// ============================================
// Financial summary
// ============================================
export async function getResumoFinanceiro(resellerId: string) {
    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: { taxa_comissao: true },
    });

    const vendas = await prisma.vendaMaleta.findMany({
        where: {
            maleta_item: {
                maleta: { reseller_id: resellerId },
            },
        },
        select: { quantidade: true, preco_unitario: true },
    });

    const totalVendido = vendas.reduce(
        (sum, v) => sum + v.quantidade * Number(v.preco_unitario),
        0
    );

    const comissaoPct = Number(reseller?.taxa_comissao || 0);
    const comissaoValor = totalVendido * (comissaoPct / 100);
    const aDevolver = totalVendido - comissaoValor;

    return {
        totalVendido,
        comissaoPct,
        comissaoValor,
        aDevolver,
        totalVendas: vendas.length,
    };
}
