import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import { env } from "../shared/env";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

function createDb() {
  return postgres({ contract, url: env.DATABASE_URL });
}

type Database = ReturnType<typeof createDb>;

// En dev, Next recharge les modules à chaud : on garde une seule instance (donc un seul pool de
// connexions) sur globalThis. Elle est liée à l'empreinte du contrat : après une migration, le
// rechargement remplace le client, sans quoi il ignorerait les nouvelles tables et colonnes
// jusqu'au redémarrage du serveur.
const storageHash: string = contractJson.storage.storageHash;
const globalForDb = globalThis as typeof globalThis & {
  __chroniDbByContract?: { db: Database; storageHash: string };
};

const cached = globalForDb.__chroniDbByContract;
if (cached !== undefined && cached.storageHash !== storageHash) {
  void cached.db.close();
}

export const db = cached?.storageHash === storageHash ? cached.db : createDb();

if (env.NODE_ENV !== "production") {
  globalForDb.__chroniDbByContract = { db, storageHash };
}

export type Db = typeof db;
