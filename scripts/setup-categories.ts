import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create categories table
    console.log("Creating categories table...");
    const { error: createError } = await supabase.rpc("exec_sql" as any, {
        query: `
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT now()
            );
            ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
            CREATE POLICY IF NOT EXISTS "categories_public_read" ON categories FOR SELECT USING (true);
            CREATE POLICY IF NOT EXISTS "categories_service_write" ON categories FOR ALL USING (true);
        `,
    });

    if (createError) {
        // RPC might not exist, try raw SQL via REST
        console.log("RPC not available, creating table via direct SQL...");
        console.log("Please run this SQL in your Supabase SQL Editor:");
        console.log(`
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_service_write" ON categories FOR ALL USING (true);
        `);

        // Try to check if table already exists
        const { data: test, error: testErr } = await supabase
            .from("categories")
            .select("id")
            .limit(1);

        if (testErr) {
            console.error("\n❌ The categories table doesn't exist yet.");
            console.log("Please run the SQL above in Supabase SQL Editor, then run this script again.");
            process.exit(1);
        }
        console.log("✅ Table already exists! Proceeding to seed...");
    } else {
        console.log("✅ Table created");
    }

    // 2. Extract unique categories from products
    console.log("\nExtracting categories from products...");
    let allProducts: { categories: string[] }[] = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase
            .from("products")
            .select("categories")
            .range(page * 1000, (page + 1) * 1000 - 1);
        if (error || !data || data.length === 0) break;
        allProducts = allProducts.concat(data);
        page++;
    }

    const uniqueCategories = new Set<string>();
    for (const p of allProducts) {
        for (const cat of p.categories || []) {
            const topLevel = cat.split(">")[0].trim();
            if (topLevel) uniqueCategories.add(topLevel);
        }
    }

    console.log(`Found ${uniqueCategories.size} unique categories`);

    // 3. Insert categories
    const slugify = (text: string) =>
        text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

    let inserted = 0;
    for (const name of uniqueCategories) {
        const { error } = await supabase
            .from("categories")
            .upsert(
                { name, slug: slugify(name) },
                { onConflict: "name" }
            );
        if (error) {
            console.error(`  ❌ ${name}: ${error.message}`);
        } else {
            inserted++;
        }
    }

    console.log(`\n✅ Inserted ${inserted} categories`);

    // 4. Verify
    const { data: cats } = await supabase
        .from("categories")
        .select("name, slug")
        .order("name");

    console.log("\nCategories:");
    for (const c of cats || []) {
        console.log(`  • ${c.name} (${c.slug})`);
    }
}

main();
