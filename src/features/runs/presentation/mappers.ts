import type { Card } from "@/features/cards";
import type { PlayResult, Run } from "../domain/run";
import {
  playResponseSchema,
  runResponseSchema,
  type HiddenCard,
  type PlayResponse,
  type RevealedCard,
  type RunResponse,
} from "./schemas";

// Les champs sont copiés un par un : ajouter un champ au domaine ne l'expose jamais par accident.
function toHiddenCard(card: Card): HiddenCard {
  const base = {
    id: card.id,
    title: card.title,
    description: card.description,
    image: { url: card.image.url, alt: card.image.alt },
  };
  return card.category === undefined ? base : { ...base, category: card.category };
}

function toRevealedCard(card: Card): RevealedCard {
  return { ...toHiddenCard(card), year: card.year };
}

export function toRunResponse(run: Run): RunResponse {
  // Le parse final garantit au runtime qu'aucune date masquée ne sort.
  return runResponseSchema.parse({
    id: run.id,
    status: run.status,
    timeline: run.timeline.map(toRevealedCard),
    hand: run.hand.map(toHiddenCard),
    drawPileCount: run.drawPile.length,
    discard: run.discard.map(toRevealedCard),
  });
}

export function toPlayResponse(result: PlayResult): PlayResponse {
  return playResponseSchema.parse({
    outcome: result.outcome,
    card: toRevealedCard(result.card),
    ...(result.drawnCard === undefined ? {} : { drawnCard: toHiddenCard(result.drawnCard) }),
    run: toRunResponse(result.run),
  });
}
