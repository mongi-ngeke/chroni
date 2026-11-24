import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import { env } from "../shared/env";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

function createDb() {
  return postgres({ contract, url: env.DATABASE_URL });
}

// En dev, Next recharge les modules à chaud : on garde une seule instance
// (donc un seul pool de connexions) sur globalThis.
const globalForDb = globalThis as typeof globalThis & { __chroniDb?: ReturnType<typeof createDb> };

export const db = globalForDb.__chroniDb ?? createDb();

if (env.NODE_ENV !== "production") {
  globalForDb.__chroniDb = db;
}
