/**
 * @file src/__tests__/performance/composite-index-presence.test.ts
 * Plan 05-03: Performance Validation
 * Verifica presença de índices compostos e padrões de query no schema.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SCHEMA_PATH = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

function getModelBody(modelName: string): string {
    const lines = schema.split("\n");
    let inModel = false;
    let depth = 0;
    const bodyLines: string[] = [];

    for (const line of lines) {
        const modelStart = line.match(new RegExp(`^\\s*model\\s+${modelName}\\s*\\{`));
        if (modelStart) {
            inModel = true;
            depth = 1;
            continue;
        }
        if (!inModel) continue;

        // Count braces to handle nested structures like @default("{}")
        for (const char of line) {
            if (char === "{") depth++;
            if (char === "}") depth--;
        }

        bodyLines.push(line);

        if (depth === 0) {
            break;
        }
    }

    return bodyLines.join("\n");
}

function hasIndex(model: string, fields: string[]): boolean {
    const body = getModelBody(model);
    if (!body) return false;
    const indexDef = `@@index([${fields.join(", ")}])`;
    const uniqueDef = `@@unique([${fields.join(", ")}])`;
    return body.includes(indexDef) || body.includes(uniqueDef);
}

function hasUnique(model: string, fields: string[]): boolean {
    const body = getModelBody(model);
    if (!body) return false;
    const uniqueDef = `@@unique([${fields.join(", ")}])`;
    return body.includes(uniqueDef);
}

describe("Performance — Composite Indexes", () => {
    describe("Reseller (identidade + RBAC)", () => {
        it("tem índice em [role] para filtro de RBAC", () => {
            expect(hasIndex("Reseller", ["role"])).toBe(true);
        });

        it("tem índice em [colaboradora_id] para scope de COLABORADORA", () => {
            expect(hasIndex("Reseller", ["colaboradora_id"])).toBe(true);
        });

        it("tem índice em [slug] para lookup de vitrina", () => {
            expect(hasIndex("Reseller", ["slug"])).toBe(true);
        });

        it("tem índice em [auth_user_id] para login", () => {
            expect(hasIndex("Reseller", ["auth_user_id"])).toBe(true);
        });

        it("tem índice em [is_active] para listagens filtradas", () => {
            expect(hasIndex("Reseller", ["is_active"])).toBe(true);
        });
    });

    describe("Maletas e vendas (alta cardinalidade)", () => {
        it("Maleta tem índice em [reseller_id]", () => {
            expect(hasIndex("Maleta", ["reseller_id"])).toBe(true);
        });

        it("Maleta tem índice em [status]", () => {
            expect(hasIndex("Maleta", ["status"])).toBe(true);
        });

        it("Maleta tem índice em [created_at] para ordenação", () => {
            expect(hasIndex("Maleta", ["created_at"])).toBe(true);
        });

        it("VendaMaleta tem índice em [maleta_id]", () => {
            expect(hasIndex("VendaMaleta", ["maleta_id"])).toBe(true);
        });

        it("VendaMaleta tem índice em [reseller_id]", () => {
            expect(hasIndex("VendaMaleta", ["reseller_id"])).toBe(true);
        });

        it("VendaMaleta tem índice em [created_at] para ordenação cronológica", () => {
            expect(hasIndex("VendaMaleta", ["created_at"])).toBe(true);
        });
    });

    describe("Catálogo de produtos", () => {
        it("ProductVariant tem índice composto único [product_id, attribute_name, attribute_value]", () => {
            expect(hasUnique("ProductVariant", ["product_id", "attribute_name", "attribute_value"])).toBe(true);
        });

        it("ProductVariant tem índice em [product_id]", () => {
            expect(hasIndex("ProductVariant", ["product_id"])).toBe(true);
        });

        it("ProductVariant tem índice em [sku]", () => {
            expect(hasIndex("ProductVariant", ["sku"])).toBe(true);
        });

        it("ResellerProduct tem índice composto único [reseller_id, product_id]", () => {
            expect(hasUnique("ResellerProduct", ["reseller_id", "product_id"])).toBe(true);
        });

        it("ProductCategory tem PK composta [product_id, category_id]", () => {
            expect(schema.match(/model ProductCategory[\s\S]*?@@id\(\[product_id, category_id\]\)/)).toBeTruthy();
        });
    });

    describe("Analytics e logs (séries temporais)", () => {
        it("AnalyticsDiario tem índice composto único [data, reseller_id, tipo]", () => {
            expect(hasUnique("AnalyticsDiario", ["data", "reseller_id", "tipo"])).toBe(true);
        });

        it("AnalyticsDiario tem índice em [data]", () => {
            expect(hasIndex("AnalyticsDiario", ["data"])).toBe(true);
        });

        it("AnalyticsAcesso tem índice em [data_acesso]", () => {
            expect(hasIndex("AnalyticsAcesso", ["data_acesso"])).toBe(true);
        });

        it("NotificacaoLog tem índice composto [tipo, created_at]", () => {
            expect(hasIndex("NotificacaoLog", ["tipo", "created_at"])).toBe(true);
        });
    });

    describe("Notificações e gamificação", () => {
        it("Notificacao tem índice em [reseller_id]", () => {
            expect(hasIndex("Notificacao", ["reseller_id"])).toBe(true);
        });

        it("Notificacao tem índice em [created_at]", () => {
            expect(hasIndex("Notificacao", ["created_at"])).toBe(true);
        });

        it("Notificacao tem índice em [lida]", () => {
            expect(hasIndex("Notificacao", ["lida"])).toBe(true);
        });

        it("PontosExtrato tem índice em [reseller_id]", () => {
            expect(hasIndex("PontosExtrato", ["reseller_id"])).toBe(true);
        });

        it("PontosExtrato tem índice em [created_at]", () => {
            expect(hasIndex("PontosExtrato", ["created_at"])).toBe(true);
        });
    });

    describe("Estoque e movimentações", () => {
        it("EstoqueMovimento tem índice em [product_variant_id]", () => {
            expect(hasIndex("EstoqueMovimento", ["product_variant_id"])).toBe(true);
        });

        it("EstoqueMovimento tem índice em [tipo]", () => {
            expect(hasIndex("EstoqueMovimento", ["tipo"])).toBe(true);
        });

        it("EstoqueMovimento tem índice em [created_at]", () => {
            expect(hasIndex("EstoqueMovimento", ["created_at"])).toBe(true);
        });
    });

    describe("Leads e documentos", () => {
        it("RevendedoraLead tem índice em [status]", () => {
            expect(hasIndex("RevendedoraLead", ["status"])).toBe(true);
        });

        it("RevendedoraLead tem índice em [created_at]", () => {
            expect(hasIndex("RevendedoraLead", ["created_at"])).toBe(true);
        });

        it("ResellerDocumento tem índice em [reseller_id]", () => {
            expect(hasIndex("ResellerDocumento", ["reseller_id"])).toBe(true);
        });
    });
});

describe("Performance — Query Patterns", () => {
    it("orderBy created_at desc nas queries de listagem deve usar índice de created_at", () => {
        // Este teste é documental: todas as entidades de listagem têm índice em created_at.
        const listagemModels = [
            "Maleta",
            "VendaMaleta",
            "Notificacao",
            "PontosExtrato",
            "EstoqueMovimento",
            "RevendedoraLead",
            "Product",
        ];
        for (const model of listagemModels) {
            expect(
                hasIndex(model, ["created_at"]),
                `Model ${model} deve ter índice em created_at para ordenação eficiente`
            ).toBe(true);
        }
    });

    it("filtrar notificações por lida + reseller_id deve usar índices existentes", () => {
        // A query WHERE lida = false AND reseller_id = X pode usar índice em reseller_id
        // ou um eventual índice composto (reseller_id, lida).
        // Documentamos que pelo menos índices separados existem.
        expect(hasIndex("Notificacao", ["reseller_id"])).toBe(true);
        expect(hasIndex("Notificacao", ["lida"])).toBe(true);
    });

    it("AnalyticsDiario lookup por data + reseller_id usa índice composto único", () => {
        expect(hasUnique("AnalyticsDiario", ["data", "reseller_id", "tipo"])).toBe(true);
        expect(hasIndex("AnalyticsDiario", ["data"])).toBe(true);
        expect(hasIndex("AnalyticsDiario", ["reseller_id"])).toBe(true);
    });
});
