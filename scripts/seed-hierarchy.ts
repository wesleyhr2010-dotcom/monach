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

const slugify = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all unique category paths from products
    let allProducts: any[] = [], p = 0;
    while (true) {
        const { data } = await supabase.from("products").select("categories").range(p * 1000, (p + 1) * 1000 - 1);
        if (!data || !data.length) break;
        allProducts = allProducts.concat(data);
        p++;
    }

    const catPaths = new Set<string>();
    for (const pr of allProducts) {
        for (const c of (pr.categories || [])) catPaths.add(c);
    }

    // 2. Clear existing categories
    console.log("Clearing existing categories...");
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Build hierarchy map: parent > child
    const parentNames = new Set<string>();
    const childMap: Map<string, string[]> = new Map(); // parent -> children

    for (const path of catPaths) {
        if (path.includes(">")) {
            const [parent, child] = path.split(">").map(s => s.trim());
            parentNames.add(parent);
            if (!childMap.has(parent)) childMap.set(parent, []);
            childMap.get(parent)!.push(child);
        } else {
            parentNames.add(path.trim());
        }
    }

    // 4. Insert parent categories first
    console.log(`\nInserting ${parentNames.size} parent categories...`);
    const parentIdMap = new Map<string, string>();
    let sortOrder = 0;

    for (const name of [...parentNames].sort()) {
        const { data, error } = await supabase
            .from("categories")
            .insert({ name, slug: slugify(name), parent_id: null, sort_order: sortOrder++ })
            .select("id")
            .single();

        if (error) {
            console.error(`  ❌ ${name}: ${error.message}`);
        } else {
            parentIdMap.set(name, data.id);
            console.log(`  ✅ ${name}`);
        }
    }

    // 5. Insert child categories
    let childCount = 0;
    const globalNames = new Set<string>([...parentNames]);

    for (const [parentName, children] of childMap) {
        const parentId = parentIdMap.get(parentName);
        if (!parentId) continue;

        let childSort = 0;
        for (const childName of [...new Set(children)].sort()) {
            // Se o nome já existir, adicionamos o pai entre parênteses para ficar único 
            // ex: "Anillos (Infantil)", "Anillos (Fiesta)"
            let fullName = childName;
            if (globalNames.has(childName)) {
                fullName = `${childName} (${parentName})`;
            }
            globalNames.add(fullName);

            const { error } = await supabase
                .from("categories")
                .insert({
                    name: fullName,
                    slug: slugify(`${parentName}-${childName}`),
                    parent_id: parentId,
                    sort_order: childSort++,
                });

            if (error) {
                console.error(`  ❌ ${parentName} > ${childName} (as ${fullName}): ${error.message}`);
            } else {
                childCount++;
                console.log(`  ✅ ${parentName} > ${childName} (as ${fullName})`);
            }
        }
    }

    console.log(`\n✅ Done: ${parentNames.size} parents + ${childCount} children = ${parentNames.size + childCount} total`);
}

main();
