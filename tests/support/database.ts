import { db } from "@/prisma/db";

/** Vide les tables de la base de test (DATABASE_URL pointe dessus, voir vitest.config.ts). */
export async function resetDatabase(): Promise<void> {
  await db.execute(db.raw.sql`TRUNCATE TABLE "RunCard", "Run", "Card" CASCADE`.affectedCount().build());
}
