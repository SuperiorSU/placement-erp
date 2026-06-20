import { defineConfig } from "prisma/config";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Prisma CLI doesn't load .env.local — do it here
const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

export default defineConfig({
  datasource: {
    // DIRECT_URL = port-5432 direct connection (required for migrations on Supabase)
    // DATABASE_URL = port-6543 pooler (used by the app at runtime via PrismaPg adapter)
    url:       process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
});
