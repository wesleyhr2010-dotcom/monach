import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { prisma } from "../src/lib/prisma";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const CSV_PATH = path.resolve(
    "/Users/wesleyhudson/Downloads",
    "wc-product-export-24-2-2026-1771964873521.csv"
);

function slugify(text: string) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV not found: ${CSV_PATH}`);
        process.exit(1);
    }

    console.log("📥 Loading categories from Prisma...");
    const dbCategories = await prisma.category.findMany();
    console.log(`✅ Loaded ${dbCategories.length} categories from DB.`);

    const categoryMap = new Map<string, string>(); // name/slug -> id
    for (const cat of dbCategories) {
        categoryMap.set(cat.slug, cat.id);
        categoryMap.set(slugify(cat.name), cat.id);
    }

    console.log("📥 Loading products from Prisma...");
    const dbProducts = await prisma.product.findMany({ select: { id: true, sku: true } });
    console.log(`✅ Loaded ${dbProducts.length} products from DB.`);

    const productMap = new Map<string, string>(); // sku -> id
    for (const p of dbProducts) {
        if (p.sku) {
            productMap.set(p.sku.toUpperCase(), p.id);
        }
    }

    console.log("\n🔄 Parsing CSV and linking categories...");
    const successCount = 0;
    let notFoundCount = 0;

    // Create a unified insert array
    const relationsToCreate: { product_id: string, category_id: string }[] = [];
    const seenRelations = new Set<string>();

    const content = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
    const { Readable } = require("stream");
    const stream = Readable.from([content]);

    stream
        .pipe(csvParser())
        .on("data", (row: any) => {
            const cleanRow: any = {};
            for (const [key, val] of Object.entries(row)) {
                cleanRow[key.replace(/^\uFEFF/, "")] = val;
            }

            const sku = (cleanRow.SKU || "").trim().toUpperCase();
            const rawCategories = cleanRow["Categorías"] || cleanRow["Categories"] || "";

            if (!sku || !rawCategories) return;

            const productId = productMap.get(sku);
            if (!productId) return; // Product not in DB

            const categoryNames = rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean);

            for (const rawCat of categoryNames) {
                // Same logic as `setup-categories.ts`: take top-level only
                const topLevel = rawCat.split(">")[0].trim();
                if (!topLevel) continue;

                const catSlug = slugify(topLevel);
                const categoryId = categoryMap.get(catSlug);

                if (categoryId) {
                    const hash = `${productId}-${categoryId}`;
                    if (!seenRelations.has(hash)) {
                        seenRelations.add(hash);
                        relationsToCreate.push({ product_id: productId, category_id: categoryId });
                    }
                } else {
                    notFoundCount++;
                }
            }
        })
        .on("end", async () => {
            console.log(`\n⏳ Inserting ${relationsToCreate.length} product-category relations...`);

            try {
                // Prisma createMany on Many-to-Many junction table
                const result = await prisma.productCategory.createMany({
                    data: relationsToCreate,
                    skipDuplicates: true // Important to avoid constraint errors
                });
                console.log(`✅ Successfully linked ${result.count} categories to products!`);
                console.log(`⚠️  Categories not found in DB: ${notFoundCount}`);
            } catch (e) {
                console.error("❌ Error inserting relations:");
                console.error(e);
            } finally {
                await prisma.$disconnect();
            }
        });
}

main().catch(console.error);
