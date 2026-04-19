import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    process.env[t.slice(0, eq)] = t.slice(eq + 1);
}

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch all categories
    const { data: categories, error: catError } = await supabase.from("categories").select("*");
    if (catError) throw catError;

    const parents = categories.filter(c => !c.parent_id);
    const children = categories.filter(c => c.parent_id);

    // 2. Build mapping from old flat path => new name
    const pathMapping = new Map<string, string>();

    for (const p of parents) {
        pathMapping.set(p.name, p.name);
    }

    for (const c of children) {
        const parent = parents.find(p => p.id === c.parent_id);
        if (!parent) continue;

        const suffix = ` (${parent.name})`;
        let rawChildName = c.name;
        if (c.name.endsWith(suffix)) {
            rawChildName = c.name.slice(0, -suffix.length);
        }

        const oldPath = `${parent.name} > ${rawChildName}`;
        pathMapping.set(oldPath, c.name);
    }

    console.log("Built Path Mapping:");
    for (const [k, v] of pathMapping.entries()) {
        console.log(`  "${k}" => "${v}"`);
    }

    // 3. Update all products
    let p = 0;
    let upCount = 0;
    while (true) {
        const { data: products } = await supabase.from("products").select("id, categories").range(p * 1000, (p + 1) * 1000 - 1);
        if (!products || !products.length) break;

        for (const pr of products) {
            if (!pr.categories || !pr.categories.length) continue;

            const newCats = [...new Set(pr.categories.map((c: string) => pathMapping.get(c) || c))];

            // Should test if arrays differ in content
            const isDiff = newCats.length !== pr.categories.length || newCats.some(c => !pr.categories.includes(c));

            if (isDiff) {
                await supabase.from("products").update({ categories: newCats }).eq("id", pr.id);
                upCount++;
            }
        }
        p++;
    }

    console.log(`\nUpdated ${upCount} products to use new categorical names.`);
}

main();
