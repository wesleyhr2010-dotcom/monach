// ============================================
// Monarca Semijoias — Prisma Client Singleton
// ============================================
// Prisma 7 requires adapter-based connections

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { withEncryptionExtension } from "./prisma/encrypt-middleware";

const SCHEMA_VERSION = "2026-04-24-notificacao-templates-v3";

function createPrismaClient() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    const extended = withEncryptionExtension(client);

    // Diagnóstico: logar models disponíveis em produção
    if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
        const hasNotificacao = "notificacao" in extended;
        const hasNotificacaoTemplate = "notificacaoTemplate" in extended;
        const hasNotificacaoLog = "notificacaoLog" in extended;
        const models = Object.keys(extended).filter((k) => !k.startsWith("$") && typeof (extended as Record<string, unknown>)[k] === "object");
        console.log(
            "[Prisma] Schema version:", SCHEMA_VERSION,
            "| Has notificacao:", hasNotificacao,
            "| Has notificacaoTemplate:", hasNotificacaoTemplate,
            "| Has notificacaoLog:", hasNotificacaoLog,
            "| Models:", models.join(",")
        );
        if (!hasNotificacao || !hasNotificacaoTemplate || !hasNotificacaoLog) {
            console.error("[Prisma] CRITICAL: notificacao* models MISSING. Available:", models.join(","));
        }
    }

    return extended;
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
    prisma?: ExtendedPrismaClient;
    __prismaSchemaVersion?: string;
};

// Invalida cache global se a versão do schema mudou (deploy novo)
if (globalForPrisma.__prismaSchemaVersion !== SCHEMA_VERSION) {
    globalForPrisma.prisma = undefined;
    globalForPrisma.__prismaSchemaVersion = SCHEMA_VERSION;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
}
