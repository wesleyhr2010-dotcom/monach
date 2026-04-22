"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { registrarVendaSchema, registrarVendaMultiplaSchema } from "@/lib/validators/maleta.schema";
import { awardPoints } from "@/lib/gamificacao";
import { sendPushNotification } from "@/lib/onesignal-server";

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
export async function registrarVendaMultipla(inputData: {
    cliente_nome: string;
    cliente_telefone: string;
    itens: Array<{ maleta_item_id: string; quantidade: number }>;
}) {
    const user = await requireAuth(["REVENDEDORA"]);
    if (!user?.profileId) throw new Error("No autorizado.");
    const resellerId = user.profileId;

    const data = registrarVendaMultiplaSchema.parse(inputData);

    await prisma.$transaction(async (tx) => {
        for (const cartItem of data.itens) {
            const maletaItem = await tx.maletaItem.findFirstOrThrow({
                where: {
                    id: cartItem.maleta_item_id,
                    maleta: { reseller_id: resellerId },
                },
            });

            // Pessimistic Lock for concurrency
            await tx.$executeRaw`SELECT id FROM maleta_itens WHERE id = ${maletaItem.id}::uuid FOR UPDATE`;

            const disponivel = maletaItem.quantidade_enviada - maletaItem.quantidade_vendida;
            if (cartItem.quantidade > disponivel) {
                throw new Error(`Apenas ${disponivel} peça(s) disponível(is) para o item (SKU limit).`);
            }

            await tx.vendaMaleta.create({
                data: {
                    maleta_id: maletaItem.maleta_id,
                    maleta_item_id: maletaItem.id,
                    reseller_id: resellerId,
                    cliente_nome: data.cliente_nome,
                    cliente_telefone: data.cliente_telefone,
                    quantidade: cartItem.quantidade,
                    preco_unitario: maletaItem.preco_fixado ?? 0,
                },
            });

            await tx.maletaItem.update({
                where: { id: maletaItem.id },
                data: { quantidade_vendida: { increment: cartItem.quantidade } },
            });
        }
        
        await awardPoints(resellerId, 'venda_multipla_maleta', tx);
    });

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

// ============================================
// Register single sale (SPEC_MALETA)
// ============================================
export async function registrarVenda(rawInput: {
    maleta_item_id: string;
    cliente_nome: string;
    cliente_telefone: string;
    preco_unitario: number;
}) {
    const user = await requireAuth(["REVENDEDORA"]);
    if (!user?.profileId) throw new Error("No autorizado.");
    const resellerId = user.profileId;

    const input = registrarVendaSchema.parse(rawInput);

    await prisma.$transaction(async (tx) => {
        const item = await tx.maletaItem.findFirstOrThrow({
            where: {
                id: input.maleta_item_id,
                maleta: { reseller_id: resellerId },
            },
        });

        // Pessimistic Lock
        await tx.$executeRaw`SELECT id FROM maleta_itens WHERE id = ${item.id}::uuid FOR UPDATE`;

        if (item.quantidade_vendida >= item.quantidade_enviada) {
            throw new Error("Este artículo ya no está disponible.");
        }

        await tx.vendaMaleta.create({
            data: {
                maleta_id: item.maleta_id,
                maleta_item_id: item.id,
                reseller_id: resellerId,
                cliente_nome: input.cliente_nome,
                cliente_telefone: input.cliente_telefone,
                preco_unitario: input.preco_unitario,
                quantidade: 1,
            },
        });

        await tx.maletaItem.update({
            where: { id: item.id },
            data: { quantidade_vendida: { increment: 1 } },
        });

        // Recompensas da gamificação
        await awardPoints(resellerId, 'venda_maleta', tx);

        // Verifica bônus de maleta completa
        const allItems = await tx.maletaItem.findMany({
            where: { maleta_id: item.maleta_id },
        });
        
        const todosVendidos = allItems.every(i => i.quantidade_vendida >= i.quantidade_enviada);
        if (todosVendidos) {
            await awardPoints(resellerId, 'maleta_completa', tx);
        }
    });

    return { success: true };
}

// ============================================
// Submit Devolucao (revendedora)
// ============================================
export async function submitDevolucao(input: {
    maleta_id: string;
    comprovante_url: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await requireAuth(["REVENDEDORA"]);
        if (!user?.profileId) {
            throw new Error("No autorizado.");
        }
        const resellerId = user.profileId;

        await prisma.$transaction(async (tx) => {
            // 1. Verificar ownership
            const maleta = await tx.maleta.findFirstOrThrow({
                where: { id: input.maleta_id, reseller_id: resellerId },
            });

            // 2. Validar estado (solo 'ativa' o 'atrasada' pueden devolver)
            if (!["ativa", "atrasada"].includes(maleta.status)) {
                throw new Error(
                    "Esta consignación no puede devolverse en su estado actual."
                );
            }

            // 3. Actualizar estado de la consignación a pendiente de revisión material
            await tx.maleta.update({
                where: { id: input.maleta_id },
                data: {
                    status: "aguardando_revisao",
                    comprovante_devolucao_url: input.comprovante_url,
                },
            });
        });

        // 4. Notificar consultora/admin (best-effort fuera de tx)
        await notificarDevolucaoPendente(resellerId, input.maleta_id);

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido al enviar devolución";
        console.error("[submitDevolucao] Error:", msg);
        return { success: false, error: msg };
    }
}

async function notificarDevolucaoPendente(resellerId: string, _maletaId: string) {
  void _maletaId; // parâmetro reservado para logs futuros
    try {
        const reseller = await prisma.reseller.findUnique({
            where: { id: resellerId },
            select: { name: true, colaboradora_id: true },
        });

        if (!reseller) return;

        const msg = `📦 ${reseller.name} devolvió su consignación. Esperando confirmación.`;

        const targetUserIds: string[] = [];

        // Notificar consultora responsable
        if (reseller.colaboradora_id) {
            const colaboradora = await prisma.reseller.findUnique({
                where: { id: reseller.colaboradora_id },
                select: { auth_user_id: true },
            });
            if (colaboradora?.auth_user_id) {
                targetUserIds.push(colaboradora.auth_user_id);
            }
        }

        // Notificar todos los ADMINs
        const admins = await prisma.reseller.findMany({
            where: { role: "ADMIN" },
            select: { auth_user_id: true },
        });
        for (const admin of admins) {
            if (admin.auth_user_id) {
                targetUserIds.push(admin.auth_user_id);
            }
        }

        if (targetUserIds.length > 0) {
            await sendPushNotification(targetUserIds, "Devolución Pendiente", msg);
        }
    } catch (err: unknown) {
        console.error("[notificarDevolucaoPendente] Error:", err);
        // Best-effort: no fallar la devolución si la notificación falla
    }
}
