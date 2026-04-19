import { prisma } from "../src/lib/prisma";

async function main() {
    try {
        console.log("Fetching raw products and categories...");
        const actualCategories = await prisma.category.findMany();
        console.log("Existing categories:", actualCategories.map(c => c.name));
        console.log("Actual categories mapping:", actualCategories.map(c => c.name));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
