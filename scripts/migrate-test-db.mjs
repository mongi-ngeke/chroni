// Applique les migrations sur la base de test (TEST_DATABASE_URL).
import "dotenv/config";
import { spawnSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("TEST_DATABASE_URL is not set (see .env.example)");
  process.exit(1);
}

const result = spawnSync("pnpm", ["prisma", "db", "migrate", "--db", url], { stdio: "inherit" });
process.exit(result.status ?? 1);
