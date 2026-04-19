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

    const { data: products } = await supabase.from("products").select("id, name, categories");
    const bad = products?.filter(p => p.categories?.some((c: string) => c.includes(">"))) || [];
    console.log(`Found ${bad.length} products with '>' in their categories array.`);
    if (bad.length > 0) {
        console.log(bad.slice(0, 5));
    }
}
main();
