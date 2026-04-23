/**
 * Seed: Gamificação — Níveis, Regras e Tiers
 * Run: npx tsx prisma/seed-gamificacao.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🎮 Seeding gamificação...");

    // ── Regras de Gamificação (7 módulos pré-definidos) ──
    const regras = [
        {
            nome: "Meta Mensal Atingida",
            acao: "meta_mensal",
            pontos: 100,
            tipo: "mensal",
            descricao: "Bônus por atingir a meta de vendas do mês",
            icone: "trophy",
            limite_diario: null,
            meta_valor: 2000000, // G$ 2.000.000
            ordem: 1,
        },
        {
            nome: "Venda na Maleta",
            acao: "venda_maleta",
            pontos: 50,
            tipo: "por_evento",
            descricao: "Pontos por cada venda registrada na maleta",
            icone: "shopping-bag",
            limite_diario: null,
            meta_valor: null,
            ordem: 2,
        },
        {
            nome: "Devolução Antecipada",
            acao: "devolucao_prazo",
            pontos: 30,
            tipo: "por_evento",
            descricao: "Devolver a maleta antes do prazo combinado",
            icone: "clock",
            limite_diario: null,
            meta_valor: null,
            ordem: 3,
        },
        {
            nome: "Compartilhar Catálogo",
            acao: "compartilhou_catalogo",
            pontos: 50,
            tipo: "diario",
            descricao: "Compartilhe produtos no WhatsApp (máx 5x/dia)",
            icone: "share-2",
            limite_diario: 5,
            meta_valor: null,
            ordem: 4,
        },
        {
            nome: "Maleta Completa",
            acao: "maleta_completa",
            pontos: 200,
            tipo: "por_evento",
            descricao: "Bônus por vender 100% dos itens da maleta",
            icone: "briefcase",
            limite_diario: null,
            meta_valor: null,
            ordem: 5,
        },
        {
            nome: "Atualizar Perfil",
            acao: "perfil_completo",
            pontos: 20,
            tipo: "unico",
            descricao: "Complete seu perfil de revendedora",
            icone: "user-check",
            limite_diario: null,
            meta_valor: null,
            ordem: 6,
        },
        {
            nome: "Primeiro Acesso",
            acao: "primeiro_acesso",
            pontos: 20,
            tipo: "unico",
            descricao: "Bem-vinda ao app Monarca!",
            icone: "sparkles",
            limite_diario: null,
            meta_valor: null,
            ordem: 7,
        },
    ];

    for (const regra of regras) {
        await prisma.gamificacaoRegra.upsert({
            where: { acao: regra.acao },
            update: {
                nome: regra.nome,
                descricao: regra.descricao,
                pontos: regra.pontos,
                icone: regra.icone,
                tipo: regra.tipo,
                limite_diario: regra.limite_diario,
                meta_valor: regra.meta_valor,
                ordem: regra.ordem,
            },
            create: regra,
        });
        console.log(`  ✅ Regra "${regra.nome}" — ${regra.pontos} pts`);
    }

    // ── Níveis de Rank (Bronce / Plata / Oro / Diamante) ──
    const niveis = [
        { nome: "Bronce", pontos_minimos: 0, cor: "#CD7F32", ordem: 1 },
        { nome: "Plata", pontos_minimos: 1000, cor: "#C0C0C0", ordem: 2 },
        { nome: "Oro", pontos_minimos: 5000, cor: "#FFD700", ordem: 3 },
        { nome: "Diamante", pontos_minimos: 15000, cor: "#B9F2FF", ordem: 4 },
    ];

    for (const nivel of niveis) {
        const existing = await prisma.nivelRegra.findFirst({
            where: { nome: nivel.nome },
        });
        if (existing) {
            await prisma.nivelRegra.update({
                where: { id: existing.id },
                data: {
                    pontos_minimos: nivel.pontos_minimos,
                    cor: nivel.cor,
                    ordem: nivel.ordem,
                },
            });
        } else {
            await prisma.nivelRegra.create({ data: nivel });
        }
        console.log(`  ✅ Nível "${nivel.nome}" — ${nivel.pontos_minimos} pts`);
    }

    // ── Tiers de Comissão Mensal ──
    const tiers = [
        { min_sales_value: 0, pct: 20, ativo: true },
        { min_sales_value: 400_000, pct: 25, ativo: true },
        { min_sales_value: 800_000, pct: 30, ativo: true },
        { min_sales_value: 1_200_000, pct: 35, ativo: true },
        { min_sales_value: 1_600_000, pct: 40, ativo: true },
    ];

    for (const tier of tiers) {
        const existing = await prisma.commissionTier.findFirst({
            where: { min_sales_value: tier.min_sales_value },
        });
        if (existing) {
            await prisma.commissionTier.update({
                where: { id: existing.id },
                data: { pct: tier.pct, ativo: tier.ativo },
            });
        } else {
            await prisma.commissionTier.create({ data: tier });
        }
        console.log(`  ✅ Tier ${tier.pct}% — G$ ${tier.min_sales_value.toLocaleString("es-PY")}`);
    }

    console.log("\n🎮 Gamificação seeded!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
