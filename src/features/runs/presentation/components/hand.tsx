import type { HiddenCard } from "../schemas";
import { CardView } from "./card-view";

interface HandProps {
  cards: readonly HiddenCard[];
  selectedCardId: string | null;
  disabled: boolean;
  onSelect(cardId: string): void;
}

export function Hand({ cards, selectedCardId, disabled, onSelect }: HandProps) {
  return (
    <ul className="flex flex-wrap items-stretch gap-3" aria-label="Votre main">
      {cards.map((card) => (
        <li key={card.id} className="flex">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={card.id === selectedCardId}
            onClick={() => onSelect(card.id)}
            className="h-full rounded-lg transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}
