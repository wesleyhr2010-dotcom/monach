import { prisma } from "../src/lib/prisma";
import fs from "fs";
import csvParser from "csv-parser";

const CSV_PATH = "/Users/wesleyhudson/Downloads/wc-product-export-24-2-2026-1771964873521.csv";

async function main() {
    console.log("Restoring product categories...");

    const dbCategories = await prisma.category.findMany();
    const categoryMap = new Map();
    dbCategories.forEach(c => categoryMap.set(c.name.toLowerCase().trim(), c.id));
    console.log(`Loaded ${dbCategories.length} DB Categories`);

    const bulkUpserts: any[] = [];
    let updatedCount = 0;
    let notFoundCount = 0;

    const rows: Record<string, string>[] = await new Promise((resolve, reject) => {
        const results: Record<string, string>[] = [];
        const content = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
        const { Readable } = require("stream");
        const stream = Readable.from([content]);
        stream
            .pipe(csvParser())
            .on('data', (r: Record<string, string>) => {
                const clean: Record<string, string> = {};
                for (const key of Object.keys(r)) {
                    clean[key.replace(/^\uFEFF/, "")] = r[key];
                }
                results.push(clean);
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });

    console.log(`Parsed CSV, got ${rows.length} rows.`);

    function findKey(r: any, search: string) {
        return Object.keys(r).find(k => k.toLowerCase().includes(search)) || '';
    }

    const allProducts = await prisma.product.findMany();
    const productBySku = new Map();
    const productByName = new Map();
    allProducts.forEach(p => {
        if (p.sku) productBySku.set(p.sku, p);
        productByName.set(p.name.trim(), p);
    });

    console.log(`Loaded ${allProducts.length} DB Products`);

    let processed = 0;
    for (const row of rows) {
        processed++;
        const sku = row.SKU?.trim();
        const nome = row.Nombre?.trim();
        const catsRaw = row['Categorías'] || row[findKey(row, 'categ')];

        if (!catsRaw) continue;

        let product = null;
        if (sku && productBySku.has(sku)) {
            product = productBySku.get(sku);
        } else if (nome && productByName.has(nome)) {
            product = productByName.get(nome);
        }

        if (!product) {
            notFoundCount++;
            continue;
        }

        if (processed % 200 === 0) {
            console.log(`Processing ${processed}/${rows.length}... (Updates: ${updatedCount}, Not Found: ${notFoundCount})`);
        }

        const parts = catsRaw.split(",").flatMap((p: string) => p.split(">")).map((p: string) => p.trim());
        const uniqueCatNames = Array.from(new Set(parts));

        const catIdsToConnect: string[] = [];
        for (const name of uniqueCatNames) {
            const id = categoryMap.get(name.toLowerCase());
            if (id) catIdsToConnect.push(id);
        }

        if (catIdsToConnect.length > 0) {
            for (const catId of catIdsToConnect) {
                bulkUpserts.push({ product_id: product.id, category_id: catId });
            }
            updatedCount++;
        }
    }

    console.log(`Prepared ${bulkUpserts.length} relationships to restore. Inserting...`);
    if (bulkUpserts.length > 0) {
        await prisma.productCategory.createMany({
            data: bulkUpserts,
            skipDuplicates: true
        });
    }

    console.log(`Finished restoring categories.`);
    console.log(`Updated products: ${updatedCount}`);
    console.log(`Products not found by SKU/Name: ${notFoundCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
