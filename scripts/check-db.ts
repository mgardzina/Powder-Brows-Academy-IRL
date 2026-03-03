
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/, "");
  console.log("Connecting to:", connectionString?.split("@")[1]); // Log host only for safety

  const pool = new Pool({
    connectionString,
    ssl: false,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.adminUser.findMany();
    console.log("Admin Users in DB:", users.map(u => ({ id: u.id, email: u.email, name: u.name })));
  } catch (error) {
    console.error("Error reading DB:", error);
  } finally {
    await pool.end();
  }
}

main();
