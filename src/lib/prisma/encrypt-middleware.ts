import crypto from "crypto";
import type { PrismaClient } from "@/generated/prisma/client";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
    : null;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "ENCRYPTION_KEY inválida ou ausente. Deve ser 32 bytes hex (64 chars)."
        );
    }
}

function encrypt(value: string): string {
    if (!ENCRYPTION_KEY) return value;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

function decrypt(value: string): string {
    if (!ENCRYPTION_KEY) return value;
    const parts = value.split(":");
    if (parts.length !== 3) return value; // não cifrado (seed legado ou já plano)
    const [ivHex, encryptedHex, authTagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

const ENCRYPTED_FIELDS = ["alias_ci_ruc", "alias_valor", "cuenta", "ci_ruc"];

function encryptData(data: Record<string, unknown>): void {
    for (const field of ENCRYPTED_FIELDS) {
        if (typeof data[field] === "string" && data[field] !== "") {
            data[field] = encrypt(data[field] as string);
        }
    }
}

function decryptItem<T extends Record<string, unknown> | null>(item: T): T {
    if (!item) return item;
    for (const field of ENCRYPTED_FIELDS) {
        const val = item[field];
        if (typeof val === "string" && val !== "" && val.includes(":")) {
            (item as Record<string, unknown>)[field] = decrypt(val);
        }
    }
    return item;
}

export function withEncryptionExtension(prisma: PrismaClient) {
    return prisma.$extends({
        query: {
            dadosBancarios: {
                create({ args, query }) {
                    if (args.data) encryptData(args.data as Record<string, unknown>);
                    return query(args);
                },
                createMany({ args, query }) {
                    if (Array.isArray(args.data)) {
                        for (const item of args.data) {
                            encryptData(item as Record<string, unknown>);
                        }
                    }
                    return query(args);
                },
                update({ args, query }) {
                    if (args.data) encryptData(args.data as Record<string, unknown>);
                    return query(args);
                },
                updateMany({ args, query }) {
                    if (args.data) encryptData(args.data as Record<string, unknown>);
                    return query(args);
                },
                upsert({ args, query }) {
                    if (args.create) encryptData(args.create as Record<string, unknown>);
                    if (args.update) encryptData(args.update as Record<string, unknown>);
                    return query(args);
                },
                async findUnique({ args, query }) {
                    const result = await query(args);
                    return decryptItem(result as Record<string, unknown> | null);
                },
                async findUniqueOrThrow({ args, query }) {
                    const result = await query(args);
                    return decryptItem(result as Record<string, unknown>);
                },
                async findFirst({ args, query }) {
                    const result = await query(args);
                    return decryptItem(result as Record<string, unknown> | null);
                },
                async findFirstOrThrow({ args, query }) {
                    const result = await query(args);
                    return decryptItem(result as Record<string, unknown>);
                },
                async findMany({ args, query }) {
                    const results = await query(args);
                    return (results as Record<string, unknown>[]).map(decryptItem);
                },
            },
        },
    });
}
