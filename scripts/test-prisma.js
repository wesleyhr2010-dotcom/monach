const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const reseller = await prisma.reseller.findFirst({
      where: { auth_user_id: "7d89d0fe-6bdb-4b3d-872d-f07ce4ed84fe" }
    });
    console.log("Success:", reseller);
  } catch (e) {
    console.error("Error instance:", e.constructor.name);
    console.error("Error Name:", e.name);
    console.error("Error Message:", e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
