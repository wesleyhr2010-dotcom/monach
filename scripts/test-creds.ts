import { createClient } from "@supabase/supabase-js";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
}

async function testSupabase() {
    console.log("\n🔍 Testing Supabase...");
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );
        const { data, error } = await supabase.from("products").select("id").limit(1);
        if (error) {
            console.log(`   ⚠️  Query error: ${error.message}`);
            console.log(`   💡  Run supabase-schema.sql in SQL Editor first`);
        } else {
            console.log(`   ✅ Supabase OK! Products table: ${data?.length ?? 0} rows`);
        }
    } catch (e: any) {
        console.log(`   ❌ Supabase failed: ${e.message}`);
    }
}

async function testR2() {
    console.log("\n🔍 Testing R2...");
    console.log(`   Bucket: ${process.env.R2_BUCKET_NAME}`);
    try {
        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });
        const result = await s3.send(new ListBucketsCommand({}));
        const buckets = result.Buckets?.map(b => b.Name) || [];
        if (buckets.includes(process.env.R2_BUCKET_NAME)) {
            console.log(`   ✅ R2 OK! Bucket "${process.env.R2_BUCKET_NAME}" found`);
        } else {
            console.log(`   ⚠️  R2 connected but bucket not found. Available: ${buckets.join(", ") || "none"}`);
        }
    } catch (e: any) {
        console.log(`   ❌ R2 failed: ${e.message}`);
    }
}

(async () => {
    console.log("🦋 Monarca — Credential Test\n==============================");
    await testSupabase();
    await testR2();
    console.log("\n==============================\nDone!");
})();
