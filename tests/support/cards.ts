import { Card, type CardProps } from "@/features/cards";

type CardOverrides = Partial<Omit<CardProps, "id" | "year">> & Pick<CardProps, "id" | "year">;

const DEFAULT_IMAGE = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
  alt: "Image de test",
  credit: "Auteur de test — CC0, via Wikimedia Commons",
};

/** Carte valide pour les tests : seuls `id` et `year` sont obligatoires. */
export function buildCard(overrides: CardOverrides): Card {
  return Card.create({
    title: `Event ${overrides.id}`,
    description: "Une description de test, sans aucune date.",
    image: DEFAULT_IMAGE,
    ...overrides,
  });
}
