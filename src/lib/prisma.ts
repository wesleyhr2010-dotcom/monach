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
        max: 10,                    // Limite de conexões por instância serverless
        idleTimeoutMillis: 30000,   // Liberar conexões ociosas após 30s
        connectionTimeoutMillis: 5000, // Timeout de conexão de 5s
    });
    const adapter = new PrismaPg(pool);

    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    const extended = withEncryptionExtension(client);

    // Log de schema version apenas em development
    if (process.env.NODE_ENV === "development") {
        console.log("[Prisma] Schema version:", SCHEMA_VERSION);
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
