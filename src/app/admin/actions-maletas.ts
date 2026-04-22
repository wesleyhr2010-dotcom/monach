"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma, MaletaStatus } from "@/generated/prisma/client";
import type { MaletaListItem, MaletaDetail } from "@/lib/types";
export type { MaletaListItem, MaletaDetail, MaletaItemDetail } from "@/lib/types";
import { mapMaletaToListItem, mapMaletaToDetail } from "@/lib/mappers/maleta.mapper";
import { sendPushNotification } from "@/lib/onesignal-server";
import { atribuirXP } from "@/app/admin/actions-gamificacao";
import { conferirMaletaSchema } from "@/lib/validators/maleta.schema";
import { requireAuth } from "@/lib/user";
import type { Role } from "@/lib/user";

// Prisma 7 + PrismaPg driver adapter does NOT support interactive transactions
// ($transaction(async tx => {...})). All operations that need atomicity must
// use the batch format: $transaction([...operations]) with pre-reads outside
// the transaction for validation.

// ============================================
// List Maletas
// ============================================

export async function getMaletas(
    resellerId?: string,
    status?: string,
    colaboradoraId?: string,
    search?: string,
    dataInicio?: string,
    dataFim?: string
): Promise<MaletaListItem[]> {
    const user = await requireAuth(["ADMIN" as Role, "COLABORADORA" as Role]);
    if (!user) return [];

    const where: Prisma.MaletaWhereInput = {};
    if (resellerId) where.reseller_id = resellerId;
    if (status) where.status = status as MaletaStatus;

    if (user.role === "COLABORADORA" && user.profileId) {
        where.reseller = { ...(where.reseller as Prisma.ResellerWhereInput), colaboradora_id: user.profileId };
    } else if (colaboradoraId) {
        where.reseller = { ...(where.reseller as Prisma.ResellerWhereInput), colaboradora_id: colaboradoraId };
    }

    if (search && !resellerId) {
        where.reseller = {
            ...(where.reseller as Prisma.ResellerWhereInput),
            name: { contains: search, mode: "insensitive" },
        };
    }

    if (dataInicio || dataFim) {
        where.created_at = {};
        if (dataInicio) where.created_at.gte = new Date(dataInicio);
        if (dataFim) where.created_at.lte = new Date(dataFim);
    }

    const maletas = await prisma.maleta.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
            reseller: { select: { id: true, name: true, avatar_url: true } },
            _count: { select: { itens: true } },
        },
    });

    return maletas.map(mapMaletaToListItem);
}

// ============================================
// Get Maleta Detail
// ============================================

export async function getMaletaById(id: string): Promise<MaletaDetail | null> {
    const maleta = await prisma.maleta.findUnique({
        where: { id },
        include: {
            reseller: {
                select: {
                    id: true,
                    name: true,
                    whatsapp: true,
                    avatar_url: true,
                    taxa_comissao: true,
                    auth_user_id: true,
                    colaboradora: {
                        select: { id: true, name: true, taxa_comissao: true },
                    },
                },
            },
            itens: {
                include: {
                    product_variant: {
                        include: {
                            product: {
                                select: { id: true, name: true, images: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!maleta) return null;

    const pontosAgg = await prisma.pontosExtrato.aggregate({
        _sum: { pontos: true },
        where: { reseller_id: maleta.reseller.id },
    });
    const totalPontos = pontosAgg._sum.pontos ?? 0;

    const nivel = await prisma.nivelRegra.findFirst({
        where: { pontos_minimos: { lte: totalPontos }, ativo: true },
        orderBy: { pontos_minimos: "desc" },
        select: { nome: true, cor: true },
    });

    const productIds = [...new Set(maleta.itens.map(i => i.product_variant.product.id))];
    const catRows = await prisma.productCategory.findMany({
        where: { product_id: { in: productIds } },
        include: { category: { select: { name: true } } },
    });
    const categoryMap = new Map<string, string | null>();
    for (const pid of productIds) {
        const row = catRows.find(r => r.product_id === pid);
        categoryMap.set(pid, row?.category?.name ?? null);
    }

    return mapMaletaToDetail(maleta, {
        nivel: nivel?.nome ?? null,
        nivel_cor: nivel?.cor ?? null,
        pontos: totalPontos,
    }, categoryMap);
}

// ============================================
// Create Maleta (with stock reservation)
// ============================================

interface CriarMaletaItem {
    product_variant_id: string;
    quantidade: number;
}

export async function criarMaleta(
    resellerId: string,
    dataLimite: string,
    itens: CriarMaletaItem[]
): Promise<{ success: boolean; id?: string; error?: string }> {
    const user = await requireAuth(["ADMIN" as Role, "COLABORADORA" as Role]);
    if (!user) return { success: false, error: "No tienes permiso para realizar esta acción." };

    try {
        // 0. RBAC: COLABORADORA só pode criar para suas revendedoras
        if (user.role === "COLABORADORA" && user.profileId) {
            const reseller = await prisma.reseller.findUnique({
                where: { id: resellerId },
                select: { colaboradora_id: true },
            });
            if (!reseller || reseller.colaboradora_id !== user.profileId) {
                return { success: false, error: "No tienes permiso para crear maletas para esta revendedora." };
            }
        }

        // 1. Verificar que revendedora no tiene maleta activa
        const maletaActiva = await prisma.maleta.findFirst({
            where: {
                reseller_id: resellerId,
                status: { in: ["ativa", "atrasada"] },
            },
        });
        if (maletaActiva) {
            return { success: false, error: "Esta revendedora ya tiene una consignación activa. Ciérrala antes de crear una nueva." };
        }

        // 2. Verify stock and get prices for each variant
        const variantIds = itens.map((i) => i.product_variant_id);
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
        });

        const variantMap = new Map(variants.map((v) => [v.id, v]));

        for (const item of itens) {
            const variant = variantMap.get(item.product_variant_id);
            if (!variant) {
                return { success: false, error: `Variante ${item.product_variant_id} no encontrada` };
            }
            if (variant.stock_quantity < item.quantidade) {
                return { success: false, error: `Stock insuficiente para "${variant.attribute_value}": disponible ${variant.stock_quantity}, solicitado ${item.quantidade}` };
            }
        }

        // 3. Create the maleta first (need the generated ID and numero)
        const maleta = await prisma.maleta.create({
            data: {
                reseller_id: resellerId,
                criada_por: user.profileId,
                data_limite: new Date(dataLimite),
                itens: {
                    create: itens.map((item) => {
                        const variant = variantMap.get(item.product_variant_id)!;
                        return {
                            product_variant_id: item.product_variant_id,
                            quantidade_enviada: item.quantidade,
                            preco_fixado: variant.price,
                        };
                    }),
                },
            },
        });

        // 4. Reserve stock (decrement) + register movements — sequential ops
        // NOTE: PrismaPg driver adapter doesn't support $transaction([...]) for 
        // operations that mix create/update with certain model types.
        // Using sequential operations with compensating rollback instead.
        const stockErrors: { variantId: string; qty: number }[] = [];
        
        for (const item of itens) {
            try {
                await prisma.productVariant.update({
                    where: { id: item.product_variant_id },
                    data: { stock_quantity: { decrement: item.quantidade } },
                });
            } catch (variantErr) {
                console.error("[criarMaleta] Error decrementing stock for variant", item.product_variant_id, variantErr);
                stockErrors.push({ variantId: item.product_variant_id, qty: item.quantidade });
            }
        }

        if (stockErrors.length > 0) {
            // Compensation: delete maleta since stock reservation partially failed
            console.error("[criarMaleta] Stock reservation failed, deleting maleta", maleta.id);
            await prisma.maleta.delete({ where: { id: maleta.id } }).catch(() => {});
            return { success: false, error: "Error al reservar stock. Intenta de nuevo." };
        }

        // Register stock movements after successful decrement
        for (const item of itens) {
            try {
                await prisma.estoqueMovimento.create({
                    data: {
                        product_variant_id: item.product_variant_id,
                        quantidade: item.quantidade,
                        tipo: "reserva_maleta",
                        motivo: `Reserva Maleta #${maleta.numero}`,
                        maleta_id: maleta.id,
                    },
                });
            } catch (movErr) {
                console.error("[criarMaleta] Error creating stock movement for variant", item.product_variant_id, movErr);
                // Non-critical: stock is already decremented, movement log is supplementary
            }
        }

        // 5. Push notification (outside transaction — best-effort)
        const reseller = await prisma.reseller.findUnique({
            where: { id: resellerId },
            select: { auth_user_id: true, name: true },
        });

        if (reseller?.auth_user_id) {
            sendPushNotification(
                [reseller.auth_user_id],
                "¡Nueva Consignación! 💼",
                `${reseller.name}, se te envió una nueva consignación. ¡Revisa las semijoyas y plazos!`
            ).catch((err: unknown) => console.error("[Push] Falha no disparo:", err));
        }

        return { success: true, id: maleta.id };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Devolver Maleta (upload comprovativo)
// ============================================

export async function devolverMaleta(
    id: string,
    comprovanteUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.maleta.update({
            where: { id },
            data: {
                status: "aguardando_revisao",
                comprovante_devolucao_url: comprovanteUrl,
            },
        });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Fechar Maleta (registrar vendas)
// ============================================

interface ItemVendido {
    maleta_item_id: string;
    quantidade_vendida: number;
}

export async function fecharMaleta(
    id: string,
    itensVendidos: ItemVendido[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const ops: Prisma.PrismaPromise<unknown>[] = [];

        for (const item of itensVendidos) {
            ops.push(
                prisma.maletaItem.update({
                    where: { id: item.maleta_item_id },
                    data: { quantidade_vendida: item.quantidade_vendida },
                })
            );
        }

        ops.push(
            prisma.maleta.update({
                where: { id },
                data: { status: "aguardando_revisao" },
            })
        );

        await prisma.$transaction(ops);

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Conciliar Maleta (freeze values, return stock) — LEGADO
// Mantido para compatibilidade. Novo fluxo usar conferirEFecharMaleta.
// ============================================

export async function conciliarMaleta(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Pre-read: get maleta with items and reseller data
        const maleta = await prisma.maleta.findUnique({
            where: { id },
            include: {
                itens: true,
                reseller: { select: { taxa_comissao: true, colaboradora_id: true, colaboradora: { select: { taxa_comissao: true } } } },
            },
        });

        if (!maleta) return { success: false, error: "Consignación no encontrada" };

        // Calculate frozen values
        let totalVendido = 0;

        const ops: Prisma.PrismaPromise<unknown>[] = [];

        for (const item of maleta.itens) {
            const preco = item.preco_fixado ? Number(item.preco_fixado) : 0;
            totalVendido += preco * item.quantidade_vendida;

            // Return unsold stock
            const naoVendido = item.quantidade_enviada - item.quantidade_vendida;
            if (naoVendido > 0) {
                ops.push(
                    prisma.productVariant.update({
                        where: { id: item.product_variant_id },
                        data: { stock_quantity: { increment: naoVendido } },
                    })
                );
            }
        }

        // Calculate commissions
        const taxaRevendedora = Number(maleta.reseller.taxa_comissao) / 100;
        const comissaoRevendedora = totalVendido * taxaRevendedora;

        let comissaoColaboradora = 0;
        if (maleta.reseller.colaboradora) {
            const taxaColab = Number(maleta.reseller.colaboradora.taxa_comissao) / 100;
            comissaoColaboradora = totalVendido * taxaColab;
        }

        // Freeze values and mark as concluida
        ops.push(
            prisma.maleta.update({
                where: { id },
                data: {
                    status: "concluida",
                    valor_total_vendido: totalVendido,
                    valor_comissao_revendedora: comissaoRevendedora,
                    valor_comissao_colaboradora: comissaoColaboradora,
                },
            })
        );

        await prisma.$transaction(ops);

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Conferir e Fechar Maleta (novo fluxo SPEC)
// ============================================

export async function conferirEFecharMaleta(
    input: {
        maleta_id: string;
        itens_conferidos: { item_id: string; quantidade_recebida: number }[];
        nota_acerto?: string;
        cierre_manual_sin_comprobante?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    const user = await requireAuth(["ADMIN" as Role, "COLABORADORA" as Role]);
    if (!user) return { success: false, error: "No tienes permiso para realizar esta acción." };

    const parsed = conferirMaletaSchema.safeParse(input);
    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return { success: false, error: firstIssue?.message || "Datos inválidos." };
    }

    const data = parsed.data;
    const cierreManual = data.cierre_manual_sin_comprobante ?? false;

    try {
        // Pre-read: get maleta data for validation and calculations
        const maleta = await prisma.maleta.findFirst({
            where: {
                id: data.maleta_id,
                ...(user.role === "COLABORADORA" && user.profileId
                    ? { reseller: { colaboradora_id: user.profileId } }
                    : {}),
            },
            include: {
                itens: true,
                reseller: {
                    select: {
                        id: true,
                        auth_user_id: true,
                        taxa_comissao: true,
                        colaboradora: { select: { id: true, taxa_comissao: true } },
                    },
                },
            },
        });

        if (!maleta) {
            return { success: false, error: "Consignación no encontrada o ya fue cerrada." };
        }

        // Validate status
        const allowedStatus = cierreManual
            ? ["ativa", "atrasada", "aguardando_revisao"]
            : ["aguardando_revisao"];
        if (!allowedStatus.includes(maleta.status)) {
            return { success: false, error: "Consignación no encontrada o ya fue cerrada." };
        }

        // Validate comprovante obrigatório (skip when cierre_manual_sin_comprobante)
        if (!cierreManual && !maleta.comprovante_devolucao_url) {
            return { success: false, error: "La revendedora aún no envió el comprobante de devolución. No se puede conferir sin comprobante." };
        }

        // Validate: quantidade_recebida <= (enviada - vendida) for each item
        for (const conferido of data.itens_conferidos) {
            const maletaItem = maleta.itens.find((i) => i.id === conferido.item_id);
            if (!maletaItem) {
                return { success: false, error: `Ítem ${conferido.item_id} no pertenece a esta consignación.` };
            }
            const esperado = maletaItem.quantidade_enviada - maletaItem.quantidade_vendida;
            if (conferido.quantidade_recebida > esperado) {
                return { success: false, error: `Cantidad recibida de "${maletaItem.product_variant_id}" supera lo esperado (${esperado}).` };
            }
            if (conferido.quantidade_recebida < 0) {
                return { success: false, error: "Cantidad recibida no puede ser negativa." };
            }
        }

        // Build batch transaction operations
        const ops: Prisma.PrismaPromise<unknown>[] = [];

        // 1. Update quantidade_recebida and return stock
        for (const conferido of data.itens_conferidos) {
            const maletaItem = maleta.itens.find((i) => i.id === conferido.item_id)!;

            ops.push(
                prisma.maletaItem.update({
                    where: { id: conferido.item_id },
                    data: { quantidade_recebida: conferido.quantidade_recebida },
                })
            );

            if (conferido.quantidade_recebida > 0) {
                ops.push(
                    prisma.productVariant.update({
                        where: { id: maletaItem.product_variant_id },
                        data: { stock_quantity: { increment: conferido.quantidade_recebida } },
                    })
                );
                ops.push(
                    prisma.estoqueMovimento.create({
                        data: {
                            product_variant_id: maletaItem.product_variant_id,
                            quantidade: conferido.quantidade_recebida,
                            tipo: "devolucao_maleta",
                            motivo: `Retorno Consignación #${maleta.numero}${data.nota_acerto ? ` — ${data.nota_acerto}` : ""}`,
                            maleta_id: maleta.id,
                        },
                    })
                );
            }
        }

        // 2. Calculate financial values (snapshots)
        const valorTotalVendido = maleta.itens.reduce(
            (sum, item) => sum + Number(item.preco_fixado ?? 0) * item.quantidade_vendida,
            0
        );
        const valorTotalEnviado = maleta.itens.reduce(
            (sum, item) => sum + Number(item.preco_fixado ?? 0) * item.quantidade_enviada,
            0
        );

        const pctComissaoRevendedora = Number(maleta.reseller.taxa_comissao);
        const comissaoRevendedora = valorTotalVendido * (pctComissaoRevendedora / 100);

        const pctColaboradora = maleta.reseller.colaboradora
            ? Number(maleta.reseller.colaboradora.taxa_comissao)
            : 0;
        const comissaoColaboradora = valorTotalVendido * (pctColaboradora / 100);

        // 3. Freeze values and close maleta
        ops.push(
            prisma.maleta.update({
                where: { id: maleta.id },
                data: {
                    status: "concluida",
                    valor_total_enviado: valorTotalEnviado,
                    valor_total_vendido: valorTotalVendido,
                    valor_comissao_revendedora: comissaoRevendedora,
                    valor_comissao_colaboradora: comissaoColaboradora,
                    pct_comissao_aplicado: pctComissaoRevendedora,
                    nota_acerto: data.nota_acerto
                        ? (cierreManual ? `Cierre manual sin comprobante — ${data.nota_acerto}` : data.nota_acerto)
                        : (cierreManual ? "Cierre manual sin comprobante" : null),
                },
            })
        );

        await prisma.$transaction(ops);

        // 4. Gamification — on-time return? (outside transaction — best-effort)
        if (new Date() <= maleta.data_limite) {
            atribuirXP(maleta.reseller.id, "devolucao_prazo").catch((err: unknown) =>
                console.error("[Gamificação] Falha ao atribuir XP devolucao_prazo:", err)
            );
        }

        // 5. Gamification — 100% sold?
        const percentualVendido = valorTotalEnviado > 0
            ? (valorTotalVendido / valorTotalEnviado) * 100
            : 0;
        if (percentualVendido >= 100) {
            atribuirXP(maleta.reseller.id, "maleta_completa").catch((err: unknown) =>
                console.error("[Gamificação] Falha ao atribuir XP maleta_completa:", err)
            );
        }

        // 6. Push notification (outside transaction — best-effort)
        if (maleta.reseller.auth_user_id) {
            sendPushNotification(
                [maleta.reseller.auth_user_id],
                "✅ Consignación cerrada",
                "Tu consignación fue conferida y cerrada exitosamente. Habla con tu consultora sobre el pago."
            ).catch((err: unknown) => console.error("[Push] Falha:", err));
        }

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Get Active Resellers (for maleta creation)
// ============================================

export async function getActiveResellers() {
    const resellers = await prisma.reseller.findMany({
        where: { is_active: true, role: "REVENDEDORA" },
        select: { id: true, name: true, avatar_url: true, whatsapp: true, taxa_comissao: true },
        orderBy: { name: "asc" },
    });

    return resellers.map((r) => ({
        ...r,
        taxa_comissao: Number(r.taxa_comissao),
    }));
}

// ============================================
// Get Colaboradoras (for filter dropdown)
// ============================================

export async function getColaboradoras() {
    const colaboradoras = await prisma.reseller.findMany({
        where: { is_active: true, role: "COLABORADORA" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    return colaboradoras;
}

// ============================================
// Fechar Manualmente Maleta (admin força fechamento)
// ============================================

export async function fecharManualmenteMaleta(
    id: string,
    itensVendidos: ItemVendido[]
): Promise<{ success: boolean; error?: string }> {
    const user = await requireAuth(["ADMIN" as Role, "COLABORADORA" as Role]);
    if (!user) return { success: false, error: "No tienes permiso." };

    try {
        // Pre-read: get maleta data
        const maleta = await prisma.maleta.findFirst({
            where: {
                id,
                status: { in: ["ativa", "atrasada"] },
                ...(user.role === "COLABORADORA" && user.profileId
                    ? { reseller: { colaboradora_id: user.profileId } }
                    : {}),
            },
            include: { itens: true },
        });

        if (!maleta) {
            return { success: false, error: "Consignación no encontrada o no está activa." };
        }

        // Build batch transaction operations
        const ops: Prisma.PrismaPromise<unknown>[] = [];

        for (const item of itensVendidos) {
            ops.push(
                prisma.maletaItem.update({
                    where: { id: item.maleta_item_id },
                    data: { quantidade_vendida: item.quantidade_vendida },
                })
            );
        }

        ops.push(
            prisma.maleta.update({
                where: { id },
                data: { status: "aguardando_revisao" },
            })
        );

        await prisma.$transaction(ops);

        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

// ============================================
// Get Available Variants (for maleta creation)
// ============================================

export async function getAvailableVariants(search?: string) {
    // 1. Get products WITH variants that have stock > 0
    const variantWhere: Record<string, unknown> = { stock_quantity: { gt: 0 } };
    if (search) {
        variantWhere.product = { name: { contains: search, mode: "insensitive" } };
    }

    const variants = await prisma.productVariant.findMany({
        where: variantWhere,
        include: {
            product: { select: { id: true, name: true, images: true, price: true } },
        },
        orderBy: { product: { name: "asc" } },
        take: 50,
    });

    const result = variants.map((v) => ({
        id: v.id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        price: v.price ? Number(v.price) : (v.product.price ? Number(v.product.price) : null),
        stock_quantity: v.stock_quantity,
        sku: v.sku,
        product: {
            id: v.product.id,
            name: v.product.name,
            images: v.product.images as string[],
        },
    }));

    return result;
}

// ============================================
// Update Maleta Status (for overdue check)
// ============================================

export async function checkOverdueMaletas() {
    const now = new Date();
    await prisma.maleta.updateMany({
        where: {
            status: "ativa",
            data_limite: { lt: now },
        },
        data: { status: "atrasada" },
    });
}


