import type { Db } from "@/prisma/db";
import { Card } from "../domain/card";
import { seedCardId, seedCards } from "./seed-data";

/** Insère ou met à jour les cartes du paquet. Rejouable sans doublon. */
export async function seedCardsInto(db: Db): Promise<number> {
  // Passer par l'entité garantit que le jeu de données respecte les règles du domaine.
  const cards = seedCards.map((seed) => Card.create({ id: seedCardId(seed.title), ...seed }));

  await db.transaction(async (tx) => {
    for (const card of cards) {
      const data = {
        title: card.title,
        year: card.year,
        category: card.category ?? null,
        description: card.description,
        imageUrl: card.image.url,
        imageAlt: card.image.alt,
        imageCredit: card.image.credit,
      };
      await tx.orm.public.Card.upsert({ create: { id: card.id, ...data }, update: data });
    }
  });
  return cards.length;
}
