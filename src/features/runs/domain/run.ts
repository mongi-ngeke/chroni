import type { Card } from "@/features/cards";
import { NotEnoughCardsError } from "./errors";

export const HAND_SIZE = 10;
// 1 carte de départ sur la frise + la main.
const MIN_CARDS = HAND_SIZE + 1;

export type RunStatus = "in_progress" | "won";

/** Mélange injecté : le domaine n'utilise jamais d'aléatoire directement. */
export type Shuffle = <T>(items: readonly T[]) => T[];

export interface StartRunInput {
  id: string;
  cards: readonly Card[];
  shuffle: Shuffle;
}

export class Run {
  private constructor(
    readonly id: string,
    readonly status: RunStatus,
    /** Cartes posées, dans l'ordre chronologique. */
    readonly timeline: readonly Card[],
    /** Main du joueur : l'ordre n'a pas de sens métier. */
    readonly hand: readonly Card[],
    /** Pioche, carte du dessus en premier. */
    readonly drawPile: readonly Card[],
    readonly discard: readonly Card[],
  ) {}

  static start({ id, cards, shuffle }: StartRunInput): Run {
    if (cards.length < MIN_CARDS) {
      throw new NotEnoughCardsError(MIN_CARDS, cards.length);
    }
    const [first, ...rest] = shuffle(cards);
    if (first === undefined) {
      throw new NotEnoughCardsError(MIN_CARDS, 0);
    }
    return new Run(id, "in_progress", [first], rest.slice(0, HAND_SIZE), rest.slice(HAND_SIZE), []);
  }
}
