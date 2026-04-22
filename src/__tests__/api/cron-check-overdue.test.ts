import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/check-overdue-maletas/route";

// ============================================
// Integration Tests — Cron Job Security
// Ref: docs/sistema/SPEC_CRON_JOBS.md
// ============================================

// Mock prisma para não depender de banco em testes de auth
vi.mock("@/lib/prisma", () => ({
    prisma: {
        maleta: {
            updateMany: vi.fn().mockResolvedValue({ count: 5 }),
        },
    },
}));

describe("GET /api/cron/check-overdue-maletas", () => {
    const originalCronSecret = process.env.CRON_SECRET;

    beforeEach(() => {
        delete process.env.CRON_SECRET;
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env.CRON_SECRET = originalCronSecret;
    });

    it("deve retornar 401 quando CRON_SECRET não estiver configurado", async () => {
        const request = new NextRequest("http://localhost:3000/api/cron/check-overdue-maletas");
        const response = await GET(request);
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
    });

    it("deve retornar 401 quando authorization header estiver ausente", async () => {
        process.env.CRON_SECRET = "test-cron-secret-123";
        const request = new NextRequest("http://localhost:3000/api/cron/check-overdue-maletas");
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it("deve retornar 401 quando CRON_SECRET for incorreto", async () => {
        process.env.CRON_SECRET = "test-cron-secret-123";
        const request = new NextRequest("http://localhost:3000/api/cron/check-overdue-maletas", {
            headers: { authorization: "Bearer wrong-secret" },
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it("deve retornar 200 quando CRON_SECRET for correto", async () => {
        process.env.CRON_SECRET = "test-cron-secret-123";
        const request = new NextRequest("http://localhost:3000/api/cron/check-overdue-maletas", {
            headers: { authorization: "Bearer test-cron-secret-123" },
        });
        const response = await GET(request);
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(typeof body.updated).toBe("number");
    });
});
