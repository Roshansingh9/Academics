import { defineConfig } from "prisma/config";
import * as fs from "fs";
import * as path from "path";

// Load .env and .env.local manually since Prisma CLI doesn't auto-load them in v7
function loadEnv() {
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
}

loadEnv();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
