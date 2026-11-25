import type { HiddenCard, RevealedCard } from "@/features/runs/presentation/schemas";

const image = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
  alt: "Image de test",
};
const description = "Une description de test, sans aucune date.";

/** Carte masquée (sans année) pour les tests de l'interface et du client API. */
export function hidden(id: string, title: string, category?: string): HiddenCard {
  return { id, title, description, image, ...(category === undefined ? {} : { category }) };
}

/** Carte révélée (avec année). */
export function revealed(id: string, title: string, year: number, category?: string): RevealedCard {
  return { ...hidden(id, title, category), year };
}
