import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/, "");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloud SQL Proxy używa Unix socket - nie wymaga SSL
const isCloudSqlProxy = process.env.DATABASE_URL?.includes("host=/cloudsql");

const pool = new Pool({
  connectionString,
  ssl: isCloudSqlProxy ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
