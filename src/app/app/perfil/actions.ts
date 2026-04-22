"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { awardPoints } from "@/lib/gamificacao";

const perfilSchema = z.object({
    name: z.string().min(2).max(100),
    whatsapp: z.string().min(8).max(20),
    avatar_url: z.string().url().optional(),
    endereco_cep: z.string().max(10).optional(),
    endereco_logradouro: z.string().max(200).optional(),
    endereco_numero: z.string().max(20).optional(),
    endereco_complemento: z.string().max(100).optional(),
    endereco_cidade: z.string().max(100).optional(),
    endereco_estado: z.string().max(100).optional(),
});

export async function actualizarPerfilRevendedora(data: z.infer<typeof perfilSchema>) {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const parsed = perfilSchema.parse(data);

    await prisma.reseller.update({
        where: { id: resellerId },
        data: {
            name: parsed.name,
            whatsapp: parsed.whatsapp,
            avatar_url: parsed.avatar_url,
            endereco_cep: parsed.endereco_cep,
            endereco_logradouro: parsed.endereco_logradouro,
            endereco_numero: parsed.endereco_numero,
            endereco_complemento: parsed.endereco_complemento,
            endereco_cidade: parsed.endereco_cidade,
            endereco_estado: parsed.endereco_estado,
        },
    });

    // Verificar perfil completo para gamificação
    const updated = await prisma.reseller.findUnique({
        where: { id: resellerId },
        select: {
            name: true,
            whatsapp: true,
            avatar_url: true,
            endereco_cep: true,
            endereco_logradouro: true,
            endereco_cidade: true,
        },
    });

    const perfilCompleto = !!(
        updated?.name &&
        updated?.whatsapp &&
        updated?.avatar_url &&
        updated?.endereco_cep &&
        updated?.endereco_logradouro &&
        updated?.endereco_cidade
    );

    if (perfilCompleto) {
        const alreadyAwarded = await prisma.pontosExtrato.findFirst({
            where: {
                reseller_id: resellerId,
                regra: { acao: "perfil_completo" },
            },
        });

        if (!alreadyAwarded) {
            await awardPoints(resellerId, "perfil_completo");
        }
    }

    return { success: true, perfilCompleto };
}

const aliasSchema = z.object({
    tipo: z.literal("alias"),
    alias_tipo: z.enum(["CI", "RUC", "Celular", "Email"]),
    alias_valor: z.string().min(1),
    alias_titular: z.string().min(2),
    alias_ci_ruc: z.string().min(4),
});

const cuentaBancariaSchema = z.object({
    tipo: z.literal("cuenta_bancaria"),
    banco: z.string().min(2),
    agencia: z.string().optional(),
    cuenta: z.string().min(4),
    tipo_cuenta: z.enum(["corriente", "ahorro"]),
    titular: z.string().min(2),
    ci_ruc: z.string().min(4),
});

const datosBancariosSchema = z.discriminatedUnion("tipo", [aliasSchema, cuentaBancariaSchema]);

export async function guardarDatosBancarios(data: z.infer<typeof datosBancariosSchema>) {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const parsed = datosBancariosSchema.parse(data);

    await prisma.dadosBancarios.upsert({
        where: { reseller_id: resellerId },
        create: {
            reseller_id: resellerId,
            tipo: parsed.tipo,
            ...(parsed.tipo === "alias"
                ? {
                      alias_tipo: parsed.alias_tipo,
                      alias_valor: parsed.alias_valor,
                      alias_titular: parsed.alias_titular,
                      alias_ci_ruc: parsed.alias_ci_ruc,
                  }
                : {
                      banco: parsed.banco,
                      agencia: parsed.agencia,
                      cuenta: parsed.cuenta,
                      tipo_cuenta: parsed.tipo_cuenta,
                      titular: parsed.titular,
                      ci_ruc: parsed.ci_ruc,
                  }),
        },
        update: {
            tipo: parsed.tipo,
            ...(parsed.tipo === "alias"
                ? {
                      banco: null,
                      agencia: null,
                      cuenta: null,
                      tipo_cuenta: null,
                      titular: null,
                      ci_ruc: null,
                      alias_tipo: parsed.alias_tipo,
                      alias_valor: parsed.alias_valor,
                      alias_titular: parsed.alias_titular,
                      alias_ci_ruc: parsed.alias_ci_ruc,
                  }
                : {
                      alias_tipo: null,
                      alias_valor: null,
                      alias_titular: null,
                      alias_ci_ruc: null,
                      banco: parsed.banco,
                      agencia: parsed.agencia,
                      cuenta: parsed.cuenta,
                      tipo_cuenta: parsed.tipo_cuenta,
                      titular: parsed.titular,
                      ci_ruc: parsed.ci_ruc,
                  }),
        },
    });

    return { success: true };
}

export async function getPerfilCompleto() {
    const user = await requireAuth(["REVENDEDORA"]);
    const resellerId = user.profileId!;

    const reseller = await prisma.reseller.findUnique({
        where: { id: resellerId },
        include: {
            colaboradora: { select: { name: true, whatsapp: true } },
            dados_bancarios: true,
            _count: { select: { pontos_extrato: true } },
        },
    });

    if (!reseller) {
        throw new Error("BUSINESS: Perfil no encontrado.");
    }

    const totalPontos = await prisma.pontosExtrato.aggregate({
        where: { reseller_id: resellerId },
        _sum: { pontos: true },
    });

    return {
        id: reseller.id,
        name: reseller.name,
        email: user.email,
        whatsapp: reseller.whatsapp,
        avatar_url: reseller.avatar_url,
        taxa_comissao: Number(reseller.taxa_comissao),
        colaboradora: reseller.colaboradora,
        endereco_cep: reseller.endereco_cep,
        endereco_logradouro: reseller.endereco_logradouro,
        endereco_numero: reseller.endereco_numero,
        endereco_complemento: reseller.endereco_complemento,
        endereco_cidade: reseller.endereco_cidade,
        endereco_estado: reseller.endereco_estado,
        dados_bancarios: reseller.dados_bancarios,
        pontos: totalPontos._sum.pontos ?? 0,
    };
}
