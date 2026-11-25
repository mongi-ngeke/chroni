import type { CardRepository } from "./card-repository";

export interface CardCredit {
  cardId: string;
  title: string;
  /** Auteur et licence de l'image, exigés par les licences Creative Commons. */
  credit: string;
}

/**
 * Crédits des images, triés par titre. Jamais par date : la liste est publique et ne doit pas
 * aider à replacer les cartes.
 */
export async function listCardCredits({ cards }: { cards: CardRepository }): Promise<CardCredit[]> {
  const all = await cards.findAll();
  return all
    .map((card) => ({ cardId: card.id, title: card.title, credit: card.image.credit }))
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
}
