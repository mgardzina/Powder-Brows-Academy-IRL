
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  let connectionString = process.env.DATABASE_URL || "";
  // Strip sslmode from URL like lib/prisma.ts does, as we handle it in Pool config
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
  
  console.log("Current DATABASE_URL (masked):", connectionString.replace(/:[^:@]+@/, ":***@"));

  const pool = new Pool({ 
    connectionString,
    // Use loose SSL validation (standard for Cloud SQL public IP without explicit certs)
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching latest ConsentForm...");
  
  try {
    const latestForm = await prisma.consentForm.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latestForm) {
      console.log("No ConsentForms found in the database.");
      return;
    }

    console.log("\n--- Latest Consent Form ---");
    console.log(`ID: ${latestForm.id}`);
    console.log(`Created At: ${latestForm.createdAt}`);
    console.log(`Client: ${latestForm.imieNazwisko} (Phone: ${latestForm.telefon})`);
    
    console.log("\n--- Audit Log ---");
    if (latestForm.auditLog) {
      console.log(JSON.stringify(latestForm.auditLog, null, 2));
      
      // Simple validation checks
      const log = latestForm.auditLog as any;
      const checks = [
        { key: "signedAt", label: "Timestamp" },
        { key: "ipAddress", label: "IP Address" },
        { key: "phoneNumber", label: "Phone Number" },
        { key: "documentHash", label: "Document Hash" },
        { key: "smsMessageId", label: "SMS Message ID" }
      ];
      
      console.log("\n--- Compliance Check ---");
      let allPass = true;
      checks.forEach(check => {
        if (log[check.key]) {
          console.log(`[PASS] ${check.label} is present: ${log[check.key]}`);
        } else {
          console.log(`[FAIL] ${check.label} is MISSING!`);
          allPass = false;
        }
      });

      if (allPass) {
        console.log("\n✅ Audit Log structure appears legally compliant.");
      } else {
        console.log("\n❌ Audit Log missing required fields!");
      }

    } else {
      console.log("❌ No Audit Log found for this form.");
    }
  } catch (error) {
    console.error("Error fetching form:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
