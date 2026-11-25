import type { HiddenCard } from "../schemas";
import { CardView } from "./card-view";

interface HandProps {
  cards: readonly HiddenCard[];
  selectedCardId: string | null;
  disabled: boolean;
  onSelect(cardId: string): void;
}

export function Hand({ cards, selectedCardId, disabled, onSelect }: HandProps) {
  // Une seule ligne, défilable, sur toute la largeur de l'écran (elle sort de la colonne centrée) ;
  // `pt-1` laisse la place à l'effet de survol. `li` et `button` en flex : chaque carte s'étire
  // à la hauteur de la plus grande.
  return (
    <div className="ml-[calc(50%-50vw)] w-screen overflow-x-auto px-4 pt-1 pb-3 sm:px-8">
      <ul className="flex w-max items-stretch gap-3" aria-label="Votre main">
        {cards.map((card) => (
          <li key={card.id} className="flex">
            <button
              type="button"
              disabled={disabled}
              aria-pressed={card.id === selectedCardId}
              onClick={() => onSelect(card.id)}
              className="flex rounded-lg transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CardView
                title={card.title}
                category={card.category}
                description={card.description}
                image={card.image}
                selected={card.id === selectedCardId}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
