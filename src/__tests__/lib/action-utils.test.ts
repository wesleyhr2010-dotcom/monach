import { describe, it, expect } from "vitest";
import { safeAction, mapError, ActionResult, generateSlug, toNumber } from "@/lib/action-utils";

// ─── Mock Prisma-like errors ───────────────────────────────────────────────

function createPrismaError(code: string, message: string): Error {
    const err = new Error(message);
    (err as any).code = code;
    return err;
}

// ─── mapError() ────────────────────────────────────────────────────────────

describe("mapError", () => {
    it("returns Spanish unique-constraint message for P2002", () => {
        const err = createPrismaError("P2002", "Unique constraint failed");
        expect(mapError(err)).toBe(
            "Ya existe un registro con ese valor. Verifica los datos e intenta de nuevo."
        );
    });

    it("returns Spanish not-found message for P2025", () => {
        const err = createPrismaError("P2025", "Record not found");
        expect(mapError(err)).toBe(
            "El registro que buscás no fue encontrado. Puede que haya sido eliminado."
        );
    });

    it("returns Spanish relation-conflict message for P2014", () => {
        const err = createPrismaError("P2014", "Relation violation");
        expect(mapError(err)).toBe(
            "Hay un conflicto en los datos relacionados. Revisá las conexiones entre registros."
        );
    });

    it("returns original message for unknown Error", () => {
        const err = new Error("Something went wrong");
        expect(mapError(err)).toBe("Something went wrong");
    });

    it("returns original message for unknown Prisma code", () => {
        const err = createPrismaError("P9999", "Unknown prisma error");
        expect(mapError(err)).toBe("Unknown prisma error");
    });

    it("returns generic message for non-Error values", () => {
        expect(mapError("string error")).toBe("Error desconocido");
        expect(mapError(null)).toBe("Error desconocido");
        expect(mapError(undefined)).toBe("Error desconocido");
        expect(mapError(42)).toBe("Error desconocido");
    });
});

// ─── safeAction() ──────────────────────────────────────────────────────────

describe("safeAction", () => {
    it("returns { success: true, data } on success", async () => {
        const result = await safeAction(async () => "hello");
        expect(result).toEqual({ success: true, data: "hello" });
    });

    it("returns { success: false, error: mappedMessage } on Prisma P2002", async () => {
        const result = await safeAction(async () => {
            throw createPrismaError("P2002", "Unique constraint failed");
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe(
                "Ya existe un registro con ese valor. Verifica los datos e intenta de nuevo."
            );
        }
    });

    it("returns { success: false, error: mappedMessage } on Prisma P2025", async () => {
        const result = await safeAction(async () => {
            throw createPrismaError("P2025", "Record not found");
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe(
                "El registro que buscás no fue encontrado. Puede que haya sido eliminado."
            );
        }
    });

    it("returns { success: false, error: mappedMessage } on Prisma P2014", async () => {
        const result = await safeAction(async () => {
            throw createPrismaError("P2014", "Relation violation");
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe(
                "Hay un conflicto en los datos relacionados. Revisá las conexiones entre registros."
            );
        }
    });

    it("returns { success: false, error: originalMessage } on unknown Error", async () => {
        const result = await safeAction(async () => {
            throw new Error("Something went wrong");
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Something went wrong");
        }
    });

    it("returns { success: false, error: genericMessage } on non-Error throw", async () => {
        const result = await safeAction(async () => {
            throw "string error";
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Error desconocido");
        }
    });

    it("works with void return type", async () => {
        const result = await safeAction(async () => {
            // no return
        });
        expect(result).toEqual({ success: true, data: undefined });
    });

    it("works with complex data types", async () => {
        const result = await safeAction(async () => {
            return { id: "123", name: "Test" };
        });
        expect(result).toEqual({ success: true, data: { id: "123", name: "Test" } });
    });
});

// ─── generateSlug() ────────────────────────────────────────────────────────

describe("generateSlug", () => {
    it("converts to lowercase and replaces spaces with hyphens", () => {
        expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("removes accents", () => {
        expect(generateSlug("São Paulo")).toBe("sao-paulo");
    });

    it("removes leading and trailing hyphens", () => {
        expect(generateSlug("  Hello  ")).toBe("hello");
    });
});

// ─── toNumber() ────────────────────────────────────────────────────────────

describe("toNumber", () => {
    it("converts string to number", () => {
        expect(toNumber("42")).toBe(42);
    });

    it("returns null for null/undefined", () => {
        expect(toNumber(null)).toBeNull();
        expect(toNumber(undefined)).toBeNull();
    });

    it("converts Prisma Decimal-like values", () => {
        expect(toNumber("99.99")).toBe(99.99);
    });
});
