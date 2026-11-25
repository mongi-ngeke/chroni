import { Fragment } from "react";
import type { RevealedCard } from "../schemas";
import { CardView } from "./card-view";

interface TimelineProps {
  cards: readonly RevealedCard[];
  /** Vrai quand une carte est sélectionnée : les emplacements deviennent cliquables. */
  slotsEnabled: boolean;
  onPlace(position: number): void;
}

function slotLabel(cards: readonly RevealedCard[], position: number): string {
  const before = cards[position - 1];
  const after = cards[position];
  if (before === undefined && after !== undefined) return `Placer avant « ${after.title} »`;
  if (after === undefined && before !== undefined) return `Placer après « ${before.title} »`;
  return `Placer entre « ${before?.title ?? ""} » et « ${after?.title ?? ""} »`;
}

function Slot({ label, enabled, onClick }: { label: string; enabled: boolean; onClick(): void }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      aria-label={label}
      onClick={onClick}
      className={
        enabled
          ? "flex min-h-40 w-10 shrink-0 self-stretch items-center justify-center rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 text-2xl font-bold text-amber-600 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          : "w-3 shrink-0 cursor-default self-stretch rounded bg-stone-200"
      }
    >
      {enabled ? "+" : null}
    </button>
  );
}

export function Timeline({ cards, slotsEnabled, onPlace }: TimelineProps) {
  return (
    <div className="overflow-x-auto pb-3" role="group" aria-label="Frise chronologique">
      <div className="flex min-w-max items-stretch gap-1 px-1">
        {cards.map((card, index) => (
          <Fragment key={card.id}>
            <Slot label={slotLabel(cards, index)} enabled={slotsEnabled} onClick={() => onPlace(index)} />
            <CardView
              title={card.title}
              category={card.category}
              description={card.description}
              image={card.image}
              year={card.year}
            />
          </Fragment>
        ))}
        <Slot label={slotLabel(cards, cards.length)} enabled={slotsEnabled} onClick={() => onPlace(cards.length)} />
      </div>
    </div>
  );
}
