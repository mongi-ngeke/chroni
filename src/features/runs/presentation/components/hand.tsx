import type { CSSProperties } from "react";
import { fanPosition } from "../game-state";
import type { HiddenCard } from "../schemas";
import { CardView } from "./card-view";

interface HandProps {
  cards: readonly HiddenCard[];
  selectedCardId: string | null;
  disabled: boolean;
  onSelect(cardId: string): void;
}

/**
 * Partie visible de chaque carte recouverte : la place disponible répartie entre les cartes,
 * entre 28 px (au-delà, la main défile) et 120 px. 16rem = largeur d'une carte ; 4rem et 12rem =
 * marges du conteneur et de l'éventail (place laissée aux coins des cartes inclinées).
 */
const fanOverlap = (count: number) =>
  `calc(-1 * (16rem - max(28px, min(120px, (100vw - 4rem - 12rem - 16rem) / ${Math.max(count - 1, 1)}))))`;

export function Hand({ cards, selectedCardId, disabled, onSelect }: HandProps) {
  // Éventail classique sur toute la largeur de l'écran : les cartes se chevauchent et pivotent
  // autour de leur bord inférieur. Survolée, focalisée ou sélectionnée, une carte passe devant et
  // se soulève pour être lue en entier. Les marges verticales laissent la place à l'arc.
  return (
    <div className="ml-[calc(50%-50vw)] w-screen overflow-x-auto px-4 pt-14 pb-20 sm:px-8">
      <ul
        className="mx-auto flex w-max items-stretch px-24"
        style={{ "--fan-overlap": fanOverlap(cards.length) } as CSSProperties}
        aria-label="Votre main"
      >
        {cards.map((card, index) => {
          const { angle, drop } = fanPosition(index, cards.length);
          const selected = card.id === selectedCardId;
          return (
            <li
              key={card.id}
              className="relative flex origin-bottom transition-transform duration-200 not-first:ml-(--fan-overlap) focus-within:z-20 hover:z-20"
              style={{ transform: `translateY(${drop}px) rotate(${angle}deg)`, zIndex: selected ? 30 : undefined }}
            >
              <button
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onSelect(card.id)}
                className={`flex rounded-lg shadow-lg transition hover:-translate-y-6 focus:outline-none focus-visible:-translate-y-6 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "-translate-y-8" : ""}`}
              >
                <CardView
                  title={card.title}
                  category={card.category}
                  description={card.description}
                  image={card.image}
                  selected={selected}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
