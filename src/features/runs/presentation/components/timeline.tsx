"use client";

import { Fragment, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { insertionPosition } from "../game-state";
import type { RevealedCard } from "../schemas";
import { CardView } from "./card-view";

interface TimelineProps {
  cards: readonly RevealedCard[];
  /** Vrai quand une carte est sélectionnée : survoler la frise ouvre un écart, cliquer y pose la carte. */
  slotsEnabled: boolean;
  onPlace(position: number): void;
}

/** Écart ouvert entre les deux cartes voisines de l'emplacement visé. */
const GAP = "4rem";

function slotLabel(cards: readonly RevealedCard[], position: number): string {
  const before = cards[position - 1];
  const after = cards[position];
  if (before === undefined && after !== undefined) return `Placer avant « ${after.title} »`;
  if (after === undefined && before !== undefined) return `Placer après « ${before.title} »`;
  return `Placer entre « ${before?.title ?? ""} » et « ${after?.title ?? ""} »`;
}

export function Timeline({ cards, slotsEnabled, onPlace }: TimelineProps) {
  // Emplacement visé : au pointeur (survol) ou au clavier (focus d'un emplacement).
  const [targeted, setTargeted] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const target = slotsEnabled ? targeted : null;

  const positionAt = (pointerX: number) =>
    insertionPosition(
      pointerX,
      cardRefs.current.slice(0, cards.length).flatMap((element) => {
        if (element === null) return [];
        const box = element.getBoundingClientRect();
        return [box.left + box.width / 2];
      }),
    );

  const place = (position: number) => {
    setTargeted(null);
    onPlace(position);
  };

  // Emplacements sans indicateur visuel : des boutons invisibles gardent la frise utilisable au
  // clavier et par les lecteurs d'écran ; leur focus ouvre l'écart, qui tient lieu d'indicateur.
  const slot = (position: number) => (
    <button
      type="button"
      disabled={!slotsEnabled}
      aria-label={slotLabel(cards, position)}
      onFocus={() => setTargeted(position)}
      onBlur={() => setTargeted(null)}
      onClick={(event) => {
        // Le clic remonterait jusqu'à la frise, qui poserait la carte une seconde fois.
        event.stopPropagation();
        place(position);
      }}
      className="sr-only"
    />
  );

  return (
    // Toute la largeur de l'écran, comme la main : la frise sort de la colonne centrée.
    // Survol et clic sur toute cette largeur : le vide à gauche de la première carte et à droite de
    // la dernière vise les extrémités de la frise. Le clic est un raccourci souris et tactile : le
    // clavier passe par les emplacements.
    <div
      className={`ml-[calc(50%-50vw)] w-screen overflow-x-auto px-4 pb-3 sm:px-8 ${slotsEnabled ? "cursor-pointer" : ""}`}
      role="group"
      aria-label="Frise chronologique"
      onPointerMove={slotsEnabled ? (event: PointerEvent) => setTargeted(positionAt(event.clientX)) : undefined}
      onPointerLeave={() => setTargeted(null)}
      onClick={slotsEnabled ? (event: MouseEvent) => place(positionAt(event.clientX)) : undefined}
    >
      {/* `mx-auto w-max` et non `justify-center` : centrée tant qu'elle tient, la frise reste
          entièrement accessible au défilement quand elle déborde (pas de début coupé à gauche). */}
      <div className="mx-auto flex w-max items-stretch gap-3 px-1">
        {cards.map((card, index) => (
          <Fragment key={card.id}>
            {slot(index)}
            <div
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className="flex transition-[margin] duration-200"
              style={{
                marginLeft: target === index ? GAP : undefined,
                marginRight: target === cards.length && index === cards.length - 1 ? GAP : undefined,
              }}
            >
              <CardView
                title={card.title}
                category={card.category}
                description={card.description}
                image={card.image}
                year={card.year}
              />
            </div>
          </Fragment>
        ))}
        {slot(cards.length)}
      </div>
    </div>
  );
}
