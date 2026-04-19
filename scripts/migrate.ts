/**
 * Monarca Semijoyas — CSV Migration Script
 * 
 * Pipeline: CSV → Download Images → Sharp (webp 1080px) → R2 Upload → Supabase Insert
 * 
 * Usage:
 *   npx tsx scripts/migrate.ts
 *   npx tsx scripts/migrate.ts --dry-run        # Preview without writing
 *   npx tsx scripts/migrate.ts --limit 5        # Process only 5 products
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import csvParser from "csv-parser";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ============================================
// Configuration
// ============================================

const CSV_PATH = path.resolve(
    "/Users/wesleyhudson/Downloads",
    "wc-product-export-24-2-2026-1771964873521.csv"
);

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : Infinity;
const MAX_CONCURRENT_DOWNLOADS = 3;

// Validate env vars
const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "R2_ACCOUNT_ID",
    "R2_BUCKET_NAME",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "NEXT_PUBLIC_R2_PUBLIC_DOMAIN",
] as const;

function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex);
            const value = trimmed.slice(eqIndex + 1);
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    }
}

loadEnv();

if (!DRY_RUN) {
    for (const key of requiredEnvVars) {
        if (!process.env[key]) {
            console.error(`❌ Missing env var: ${key}`);
            process.exit(1);
        }
    }
}

// ============================================
// Clients
// ============================================

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
    { auth: { persistSession: false } }
);

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || "";

// ============================================
// Types
// ============================================

interface CsvRow {
    Tipo: string;
    SKU: string;
    Nombre: string;
    "Descripción corta": string;
    Descripción: string;
    "Precio normal": string;
    Categorías: string;
    Imágenes: string;
    "Nombre del atributo 1": string;
    "Valor(es) del atributo 1": string;
}

interface ProcessedProduct {
    sku: string;
    name: string;
    short_description: string;
    description: string;
    price: number | null;
    categories: string[];
    images: string[];
    product_type: "simple" | "variable";
    variants: { attribute_name: string; attribute_value: string }[];
}

// ============================================
// Helpers
// ============================================

function generateSku(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function parseCategories(raw: string): string[] {
    if (!raw || !raw.trim()) return [];
    return raw
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
}

function parseImageUrls(raw: string): string[] {
    if (!raw || !raw.trim()) return [];
    return raw
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.startsWith("http"));
}

function cleanHtml(text: string): string {
    if (!text) return "";
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\r\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .trim();
}

async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "MonarcaMigration/1.0",
            },
        });
        if (!response.ok) {
            console.warn(`  ⚠️  Failed to download: ${url} (${response.status})`);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.warn(`  ⚠️  Error downloading: ${url}`, error);
        return null;
    }
}

async function processImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .resize(1080, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
}

async function uploadToR2(key: string, buffer: Buffer): Promise<string> {
    await s3.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "image/webp",
        })
    );
    return `${R2_PUBLIC_DOMAIN}/${key}`;
}

// Semaphore for rate limiting
class Semaphore {
    private queue: (() => void)[] = [];
    private current = 0;

    constructor(private max: number) { }

    async acquire(): Promise<void> {
        if (this.current < this.max) {
            this.current++;
            return;
        }
        return new Promise<void>((resolve) => {
            this.queue.push(() => {
                this.current++;
                resolve();
            });
        });
    }

    release(): void {
        this.current--;
        const next = this.queue.shift();
        if (next) next();
    }
}

// ============================================
// CSV Reader
// ============================================

function readCsv(): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const rows: CsvRow[] = [];
        // Strip BOM from file before parsing
        const content = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
        const { Readable } = require("stream");
        const stream = Readable.from([content]);
        stream
            .pipe(csvParser())
            .on("data", (row: Record<string, string>) => {
                // Normalize keys by stripping any remaining BOM chars
                const clean: Record<string, string> = {};
                for (const [key, val] of Object.entries(row)) {
                    clean[key.replace(/^\uFEFF/, "")] = val;
                }
                rows.push(clean as unknown as CsvRow);
            })
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}

// ============================================
// Main Migration
// ============================================

async function migrate() {
    console.log("🦋 Monarca Semijoyas — CSV Migration");
    console.log(`📁 CSV: ${CSV_PATH}`);
    console.log(`🔧 Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
    console.log(`📦 Limit: ${LIMIT === Infinity ? "none" : LIMIT}`);
    console.log("---");

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV file not found: ${CSV_PATH}`);
        console.log("💡 Place your CSV file at the project root.");
        process.exit(1);
    }

    const rows = await readCsv();
    console.log(`📋 Total rows in CSV: ${rows.length}`);

    // Filter: only simple and variable products
    const productRows = rows.filter(
        (r) => r.Tipo === "simple" || r.Tipo === "variable"
    );
    console.log(`🎯 Products to migrate: ${Math.min(productRows.length, LIMIT)}`);
    console.log("---\n");

    const semaphore = new Semaphore(MAX_CONCURRENT_DOWNLOADS);
    let successCount = 0;
    let errorCount = 0;
    const skippedCount = 0;

    const toProcess = productRows.slice(0, LIMIT);

    for (let i = 0; i < toProcess.length; i++) {
        const row = toProcess[i];
        const index = i + 1;
        const name = row.Nombre?.trim() || "Sin nombre";
        const sku = row.SKU?.trim() || generateSku();
        const productType = row.Tipo as "simple" | "variable";

        console.log(`[${index}/${toProcess.length}] ${name} (SKU: ${sku}, Type: ${productType})`);

        try {
            // Parse data
            const price = row["Precio normal"]
                ? parseFloat(row["Precio normal"].replace(/[^0-9.]/g, ""))
                : null;
            const categories = parseCategories(row.Categorías);
            const imageUrls = parseImageUrls(row.Imágenes);

            // Parse variants for variable products
            const variants: { attribute_name: string; attribute_value: string }[] = [];
            if (productType === "variable") {
                const attrName = row["Nombre del atributo 1"]?.trim();
                const attrValues = row["Valor(es) del atributo 1"]?.trim();
                if (attrName && attrValues) {
                    for (const val of attrValues.split(",")) {
                        const trimmed = val.trim();
                        if (trimmed) {
                            variants.push({
                                attribute_name: attrName,
                                attribute_value: trimmed,
                            });
                        }
                    }
                }
            }

            // Process images
            const r2Urls: string[] = [];

            if (!DRY_RUN && imageUrls.length > 0) {
                for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
                    const imgUrl = imageUrls[imgIdx];
                    await semaphore.acquire();

                    try {
                        console.log(`  📥 Downloading image ${imgIdx + 1}/${imageUrls.length}...`);
                        const rawBuffer = await downloadImage(imgUrl);

                        if (rawBuffer) {
                            console.log(`  🔄 Processing with sharp...`);
                            const webpBuffer = await processImage(rawBuffer);

                            const r2Key = `produtos/${sku}-${imgIdx + 1}.webp`;
                            console.log(`  ☁️  Uploading to R2: ${r2Key}`);
                            const publicUrl = await uploadToR2(r2Key, webpBuffer);
                            r2Urls.push(publicUrl);
                        }
                    } finally {
                        semaphore.release();
                    }
                }
            } else if (DRY_RUN) {
                // In dry run, just map URLs
                for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
                    r2Urls.push(`${R2_PUBLIC_DOMAIN || "https://r2.example.com"}/produtos/${sku}-${imgIdx + 1}.webp`);
                }
            }

            // Insert into Supabase
            if (!DRY_RUN) {
                // Insert product
                const { data: product, error: productError } = await supabase
                    .from("products")
                    .insert({
                        sku,
                        name,
                        short_description: cleanHtml(row["Descripción corta"] || ""),
                        description: cleanHtml(row.Descripción || ""),
                        price,
                        categories,
                        images: r2Urls,
                        product_type: productType,
                    })
                    .select("id")
                    .single();

                if (productError) {
                    throw new Error(`Supabase insert error: ${productError.message}`);
                }

                // Insert variants if variable product
                if (variants.length > 0 && product) {
                    const variantRows = variants.map((v) => ({
                        product_id: product.id,
                        attribute_name: v.attribute_name,
                        attribute_value: v.attribute_value,
                        price: price, // Use parent price as default for all variants
                    }));

                    const { error: variantError } = await supabase
                        .from("product_variants")
                        .insert(variantRows);

                    if (variantError) {
                        console.warn(`  ⚠️  Variant insert error: ${variantError.message}`);
                    } else {
                        console.log(`  🔀 Created ${variants.length} variants`);
                    }
                }
            }

            console.log(
                `  ✅ ${DRY_RUN ? "[DRY] " : ""}Done — ${r2Urls.length} images, ${variants.length} variants, price: ${price ? `₲${price.toLocaleString()}` : "N/A"}`
            );
            successCount++;
        } catch (error) {
            console.error(`  ❌ Error:`, error);
            errorCount++;
        }

        console.log("");
    }

    // Summary
    console.log("===================================");
    console.log("📊 Migration Summary");
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📦 Total:   ${toProcess.length}`);
    console.log("===================================");
}

migrate().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
});
