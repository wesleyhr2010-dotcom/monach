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
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    let all: any[] = [], p = 0;
    while (true) {
        const { data } = await s.from("products").select("categories").range(p * 1000, (p + 1) * 1000 - 1);
        if (!data || !data.length) break;
        all = all.concat(data);
        p++;
    }
    const cats = new Set<string>();
    for (const pr of all) for (const c of (pr.categories || [])) cats.add(c);
    const sorted = [...cats].sort();
    for (const c of sorted) console.log(c);
    console.log("---");
    console.log("Total unique:", sorted.length);
}
main();
