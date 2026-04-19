/**
 * Seed: Gamificação — Níveis e Regras
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

    // Níveis removidos do schema.    // Seed Regras
    const regras = [
        { nome: "Venda na Maleta", acao: "venda_maleta", pontos: 10, descricao: "Pontos por cada venda registrada" },
        { nome: "Meta Mensal Atingida", acao: "meta_mensal", pontos: 100, descricao: "Bônus por atingir meta mensal" },
        { nome: "Devolução no Prazo", acao: "devolucao_prazo", pontos: 50, descricao: "Devolver maleta antes do prazo" },
        { nome: "Primeiro Acesso ao App", acao: "primeiro_acesso", pontos: 20, descricao: "Recompensa de boas-vindas" },
        { nome: "Maleta Completa", acao: "maleta_completa", pontos: 200, descricao: "Vender 100% dos itens da maleta" },
    ];

    for (const regra of regras) {
        const existing = await prisma.gamificacaoRegra.findFirst({
            where: { acao: regra.acao },
        });
        if (!existing) {
            await prisma.gamificacaoRegra.create({ data: regra });
            console.log(`  ✅ Regra "${regra.nome}" — ${regra.pontos} XP`);
        } else {
            console.log(`  ⏭️  Regra "${regra.nome}" já existe`);
        }
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
