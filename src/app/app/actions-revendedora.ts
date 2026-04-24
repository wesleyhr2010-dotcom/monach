"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";
import { registrarVendaSchema, registrarVendaMultiplaSchema } from "@/lib/validators/maleta.schema";
import { awardPoints, getRankAtual, computeCommissionPct } from "@/lib/gamificacao";
import { sendPushNotification } from "@/lib/onesignal-server";
import { notificarRevendedora } from "@/lib/notifications";

function getMonthBounds() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
}

export async function getDashboardCompleto() {
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    if (!user.profileId) {
        throw new Error("BUSINESS: Perfil no encontrado.");
    }

    const resellerId = user.profileId;
    const { start, end } = getMonthBounds();

    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: { name: true, avatar_url: true },
    });

    // Métricas do mês civil vigente
    const vendasMes = await prisma.vendaMaleta.findMany({
        where: {
            reseller_id: resellerId,
            created_at: { gte: start, lt: end },
        },
        select: {
            quantidade: true,
            preco_unitario: true,
        },
    });

    const faturamentoMes = vendasMes.reduce(
        (sum, v) => sum + v.quantidade * Number(v.preco_unitario),
        0
    );
    const pecasVendidasMes = vendasMes.reduce((sum, v) => sum + v.quantidade, 0);

    // Pontos históricos totais
    const pontosAggr = await prisma.pontosExtrato.aggregate({
        where: { reseller_id: resellerId },
        _sum: { pontos: true },
    });
    const pontosSaldo = pontosAggr._sum.pontos ?? 0;

    // Maleta ativa
    const maletaAtiva = await prisma.maleta.findFirst({
        where: {
            reseller_id: resellerId,
            status: { in: ["ativa", "atrasada"] },
        },
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            status: true,
            data_limite: true,
        },
    });

    // Todas as maletas para histórico rápido
    const maletas = await prisma.maleta.findMany({
        where: { reseller_id: resellerId },
        include: {
            itens: {
                select: {
                    quantidade_enviada: true,
                    quantidade_vendida: true,
                },
            },
        },
        orderBy: { created_at: "desc" },
    });

    const historicoMaletas = maletas.map((m) => ({
        id: m.id,
        status: m.status,
        data_limite: m.data_limite,
        totalItens: m.itens.reduce((acc, item) => acc + item.quantidade_enviada, 0),
        vendidos: m.itens.reduce((acc, item) => acc + item.quantidade_vendida, 0),
    }));

    const [rank, commissionInfo, allTiers] = await Promise.all([
        getRankAtual(resellerId),
        computeCommissionPct(faturamentoMes),
        prisma.commissionTier.findMany({
            where: { ativo: true },
            orderBy: { min_sales_value: "asc" },
        }),
    ]);

    const ganhosMes = faturamentoMes * ((commissionInfo.tierAtual?.pct ?? 0) / 100);

    const tiers = allTiers.map((t) => ({
        pct: Number(t.pct),
        min_sales_value: Number(t.min_sales_value),
    }));

    return {
        nome: reseller?.name || "Revendedora",
        avatarUrl: reseller?.avatar_url || null,
        rank,
        pontosSaldo,
        faturamentoMes,
        ganhosMes,
        pecasVendidasMes,
        maletaAtiva,
        historicoMaletas,
        commissionInfo: { ...commissionInfo, tiers },
    };
}

// ============================================
// Get active maleta for a reseller
// ============================================
export async function getMinhasMaletas(resellerId: string) {
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    // Prevenir IDOR: garantir que a revendedora só veja seus próprios dados
    if (user.role === "REVENDEDORA" && user.profileId !== resellerId) {
        throw new Error("BUSINESS: No tienes permiso para ver estas consignaciones.");
    }
    if (user.role === "COLABORADORA" && user.profileId) {
        await assertIsInGroup(resellerId, user.profileId);
    }
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
    const resellerId = user.profileId!;

    const data = registrarVendaMultiplaSchema.parse(inputData);

    const pontos = await prisma.$transaction(async (tx) => {
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
        
        return awardPoints(resellerId, 'venda_multipla_maleta', tx);
    });

    if (pontos) {
        await notificarRevendedora({
            reseller_id: resellerId,
            tipo: "pontos_ganhos",
            titulo: "¡Puntos ganados!",
            mensagem: `¡Ganaste ${pontos.pontos} puntos! ${pontos.descricao}`,
            dados: { pontos: pontos.pontos, motivo: pontos.descricao },
        });
    }

    return { success: true };
}

// ============================================
// Get all sales for a reseller
// ============================================
export async function getMinhasVendas(resellerId: string) {
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    if (user.role === "REVENDEDORA" && user.profileId !== resellerId) {
        throw new Error("BUSINESS: No tienes permiso para ver estas ventas.");
    }
    if (user.role === "COLABORADORA" && user.profileId) {
        await assertIsInGroup(resellerId, user.profileId);
    }
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
    const user = await requireAuth(["REVENDEDORA", "ADMIN", "COLABORADORA"]);
    if (user.role === "REVENDEDORA" && user.profileId !== resellerId) {
        throw new Error("BUSINESS: No tienes permiso para ver este resumen.");
    }
    if (user.role === "COLABORADORA" && user.profileId) {
        await assertIsInGroup(resellerId, user.profileId);
    }
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
    preco_unitario?: number;
}) {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const input = registrarVendaSchema.parse(rawInput);

    const { pontosVenda, pontosCompleta } = await prisma.$transaction(async (tx) => {
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
                    preco_unitario: item.preco_fixado ?? 0,
                    quantidade: 1,
            },
        });

        await tx.maletaItem.update({
            where: { id: item.id },
            data: { quantidade_vendida: { increment: 1 } },
        });

        // Recompensas da gamificação
        const pontosVenda = await awardPoints(resellerId, 'venda_maleta', tx);

        // Verifica bônus de maleta completa
        const allItems = await tx.maletaItem.findMany({
            where: { maleta_id: item.maleta_id },
        });

        const todosVendidos = allItems.every(i => i.quantidade_vendida >= i.quantidade_enviada);
        const pontosCompleta = todosVendidos
            ? await awardPoints(resellerId, 'maleta_completa', tx)
            : null;

        return { pontosVenda, pontosCompleta };
    });

    // Notificações de pontos (best-effort fora da tx)
    if (pontosVenda) {
        await notificarRevendedora({
            reseller_id: resellerId,
            tipo: "pontos_ganhos",
            titulo: "¡Puntos ganados!",
            mensagem: `¡Ganaste ${pontosVenda.pontos} puntos! ${pontosVenda.descricao}`,
            dados: { pontos: pontosVenda.pontos, motivo: pontosVenda.descricao },
        });
    }
    if (pontosCompleta) {
        await notificarRevendedora({
            reseller_id: resellerId,
            tipo: "pontos_ganhos",
            titulo: "¡Puntos ganados!",
            mensagem: `¡Ganaste ${pontosCompleta.pontos} puntos! ${pontosCompleta.descricao}`,
            dados: { pontos: pontosCompleta.pontos, motivo: pontosCompleta.descricao },
        });
    }

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
        const resellerId = user.profileId!;

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
        console.error("[notificarDevolucaoPendente] Error:", err instanceof Error ? err.message : String(err));
        // Best-effort: no fallar la devolución si la notificación falla
    }
}

// ============================================
// Catálogo — Itens da maleta ativa
// ============================================

export async function getCatalogoRevendedora() {
    const user = await requireAuth(["REVENDEDORA"]);
    if (!user.profileId) {
        throw new Error("BUSINESS: Perfil no encontrado.");
    }
    const resellerId = user.profileId;

    const maletaAtiva = await prisma.maleta.findFirst({
        where: {
            reseller_id: resellerId,
            status: { in: ["ativa", "atrasada"] },
        },
        orderBy: { created_at: "desc" },
        include: {
            itens: {
                where: {
                    quantidade_vendida: { lt: prisma.maletaItem.fields.quantidade_enviada },
                },
                include: {
                    product_variant: {
                        include: {
                            product: {
                                include: {
                                    categories: {
                                        include: { category: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!maletaAtiva) {
        return { maleta: null, itens: [] };
    }

    const itens = maletaAtiva.itens
        .filter((item) => item.quantidade_vendida < item.quantidade_enviada)
        .map((item) => ({
            id: item.id,
            maleta_item_id: item.id,
            product_variant_id: item.product_variant_id,
            preco_fixado: Number(item.preco_fixado || 0),
            quantidade_enviada: item.quantidade_enviada,
            quantidade_vendida: item.quantidade_vendida,
            disponivel: item.quantidade_enviada - item.quantidade_vendida,
            producto: {
                id: item.product_variant.product.id,
                name: item.product_variant.product.name,
                sku: item.product_variant.sku || item.product_variant.product.sku,
                slug: item.product_variant.product.id,
                images: item.product_variant.image_url
                    ? [item.product_variant.image_url]
                    : item.product_variant.product.images,
                category: item.product_variant.product.categories[0]?.category?.name || "",
            },
            variante: {
                id: item.product_variant.id,
                attribute_name: item.product_variant.attribute_name,
                attribute_value: item.product_variant.attribute_value,
            },
        }));

    return {
        maleta: {
            id: maletaAtiva.id,
            numero: maletaAtiva.numero,
            status: maletaAtiva.status,
            data_limite: maletaAtiva.data_limite,
        },
        itens,
    };
}

// ============================================
// Gamificação — Compartilhar catálogo
// ============================================

export async function registrarPuntosCompartirCatalogo() {
    const user = await requireAuth(["REVENDEDORA"]);
    if (!user.profileId) return { success: false, error: "Perfil no encontrado" };
    const resellerId = user.profileId;

    try {
        await awardPoints(resellerId, "compartilhou_catalogo");
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao registrar pontos";
        return { success: false, error: msg };
    }
}
