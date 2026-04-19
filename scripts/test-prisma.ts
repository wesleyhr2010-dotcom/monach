import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
    try {
        const result = await prisma.reseller.findFirst({
            where: { auth_user_id: "7d89d0fe-6bdb-4b3d-872d-f07ce4ed84fe" }
        });
        console.log("Success:", result);
    } catch (e: any) {
        console.error("Code:", e.code);
        console.error("Meta:", e.meta);
        console.error("Error instance:", e.constructor.name);
        console.error("Full Message:", e.message);
    }
}
main();
