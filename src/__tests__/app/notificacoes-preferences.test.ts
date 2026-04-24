import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Testes — Preferências de Notificações Push
// Ref: docs/revendedoras/SPEC_NOTIFICACOES.md
// ============================================

vi.mock("@/lib/user", async (importOriginal) => {
    const mod = await importOriginal<typeof import("@/lib/user")>();
    return {
        ...mod,
        requireAuth: vi.fn(),
    };
});

vi.mock("@/lib/prisma", () => ({
    prisma: {
        notificacaoPreferencia: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

// Importar APÓS os vi.mock
import {
    getPreferenciasNotificaciones,
    actualizarPreferenciasNotificaciones,
} from "@/app/app/perfil/actions";
import { requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedPrisma = prisma as unknown as {
    notificacaoPreferencia: {
        findUnique: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
    };
};

const MOCK_RESELLER_ID = "550e8400-e29b-41d4-a716-446655440000";
const MOCK_USER = {
    id: "user-123",
    email: "test@example.com",
    role: "REVENDEDORA" as const,
    profileId: MOCK_RESELLER_ID,
    isActive: true,
};

describe("Preferências de Notificações — getPreferenciasNotificaciones", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedRequireAuth.mockResolvedValue(MOCK_USER);
    });

    it("deve retornar preferências salvas quando existem no banco", async () => {
        const stored = {
            nova_maleta: true,
            prazo_proximo: false,
            maleta_atrasada: true,
            acerto_confirmado: false,
            brinde_entregue: true,
            pontos_ganhos: true,
        };
        mockedPrisma.notificacaoPreferencia.findUnique.mockResolvedValue(stored);

        const result = await getPreferenciasNotificaciones();

        expect(result).toEqual(stored);
        expect(mockedPrisma.notificacaoPreferencia.findUnique).toHaveBeenCalledWith({
            where: { reseller_id: MOCK_RESELLER_ID },
        });
    });

    it("deve retornar defaults da SPEC quando não há registro no banco", async () => {
        mockedPrisma.notificacaoPreferencia.findUnique.mockResolvedValue(null);

        const result = await getPreferenciasNotificaciones();

        expect(result).toEqual({
            nova_maleta: true,
            prazo_proximo: true,
            maleta_atrasada: true,
            acerto_confirmado: true,
            brinde_entregue: true,
            pontos_ganhos: false,
        });
    });

    it("deve chamar requireAuth com role REVENDEDORA", async () => {
        mockedPrisma.notificacaoPreferencia.findUnique.mockResolvedValue(null);

        await getPreferenciasNotificaciones();

        expect(mockedRequireAuth).toHaveBeenCalledWith(["REVENDEDORA"]);
    });
});

describe("Preferências de Notificações — actualizarPreferenciasNotificaciones", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedRequireAuth.mockResolvedValue(MOCK_USER);
    });

    it("deve fazer upsert das preferências no banco", async () => {
        const data = {
            nova_maleta: false,
            prazo_proximo: true,
            maleta_atrasada: false,
            acerto_confirmado: true,
            brinde_entregue: false,
            pontos_ganhos: true,
        };
        mockedPrisma.notificacaoPreferencia.upsert.mockResolvedValue({ id: "pref-1", ...data });

        const result = await actualizarPreferenciasNotificaciones(data);

        expect(result).toEqual({ success: true });
        expect(mockedPrisma.notificacaoPreferencia.upsert).toHaveBeenCalledWith({
            where: { reseller_id: MOCK_RESELLER_ID },
            create: { reseller_id: MOCK_RESELLER_ID, ...data },
            update: data,
        });
    });

    it("deve validar schema Zod e rejeitar dados inválidos", async () => {
        // @ts-expect-error — teste de validação com dados inválidos
        const invalidData = {
            nova_maleta: "sim", // deve ser boolean
            prazo_proximo: true,
            maleta_atrasada: true,
            acerto_confirmado: true,
            brinde_entregue: true,
            pontos_ganhos: false,
        };

        await expect(actualizarPreferenciasNotificaciones(invalidData)).rejects.toThrow();
        expect(mockedPrisma.notificacaoPreferencia.upsert).not.toHaveBeenCalled();
    });

});
