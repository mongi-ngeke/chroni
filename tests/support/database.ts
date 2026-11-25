import { db } from "@/prisma/db";

/** Vide les tables de la base de test (DATABASE_URL pointe dessus, voir vitest.config.ts). */
export async function resetDatabase(): Promise<void> {
  await db.execute(db.raw.sql`TRUNCATE TABLE "RunCard", "Run", "Session", "User", "Card" CASCADE`.affectedCount().build());
}

interface CardRowInput {
  id: string;
  year: number;
  title?: string;
  category?: string;
  description?: string;
}

/** Insère une carte valide en base ; seuls `id` et `year` sont obligatoires. */
export async function insertCard(input: CardRowInput) {
  return db.orm.public.Card.create({
    id: input.id,
    title: input.title ?? `Event ${input.id}`,
    year: input.year,
    ...(input.category === undefined ? {} : { category: input.category }),
    description: input.description ?? "Une description de test, sans aucune date.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
    imageAlt: "Image de test",
    imageCredit: "Auteur de test — CC0, via Wikimedia Commons",
  });
}

/** Insère un compte en base (empreinte factice : à n'utiliser que là où le mot de passe ne compte pas). */
export async function insertUser(id: string, email = `${id}@example.org`) {
  return db.orm.public.User.create({ id, email, passwordHash: "scrypt$test" });
}
