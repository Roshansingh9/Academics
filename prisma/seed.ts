import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

// Load env files (tsx doesn't auto-load them)
for (const file of [".env", ".env.local"]) {
  const envPath = path.join(process.cwd(), file);
  if (!fs.existsSync(envPath)) continue;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const val = match[2].trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existing) {
    console.log("Admin already seeded, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.create({
    data: {
      userId: "ADMIN",
      email: "admin@leafclutchtech.com.np",
      passwordHash,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });

  console.log("Admin seeded successfully.");
  console.log("  userId: ADMIN");
  console.log("  email:  admin@leafclutchtech.com.np");
  console.log("  password: Admin@123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
