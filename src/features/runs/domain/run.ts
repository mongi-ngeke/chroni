import type { Card } from "@/features/cards";
import { CardNotInHandError, InvalidPositionError, NotEnoughCardsError, RunAlreadyWonError } from "./errors";

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
  /** Joueur connecté qui lance la partie ; absent (ou `null`) pour une partie d'invité. */
  ownerId?: string | null;
}

export interface PlayCardInput {
  cardId: string;
  /** Indice d'insertion dans la frise : 0 = avant la 1re carte, longueur = après la dernière. */
  position: number;
}

export interface PlayResult {
  outcome: "correct" | "incorrect";
  /** La carte jouée, date comprise : elle est révélée dans les deux cas. */
  card: Card;
  /** Carte piochée après une erreur ; absente si le placement est correct ou la pioche vide. */
  drawnCard?: Card;
  run: Run;
}

export interface RunState {
  id: string;
  status: RunStatus;
  /** Absent (ou `null`) : partie d'invité. */
  ownerId?: string | null;
  timeline: readonly Card[];
  hand: readonly Card[];
  drawPile: readonly Card[];
  discard: readonly Card[];
}

export class Run {
  private constructor(
    readonly id: string,
    readonly status: RunStatus,
    /** Propriétaire : la partie est privée. `null` : partie d'invité, ouverte à qui a son URL. */
    readonly ownerId: string | null,
    /** Cartes posées, dans l'ordre chronologique. */
    readonly timeline: readonly Card[],
    /** Main du joueur : l'ordre n'a pas de sens métier. */
    readonly hand: readonly Card[],
    /** Pioche, carte du dessus en premier. */
    readonly drawPile: readonly Card[],
    readonly discard: readonly Card[],
  ) {}

  static start({ id, cards, shuffle, ownerId = null }: StartRunInput): Run {
    if (cards.length < MIN_CARDS) {
      throw new NotEnoughCardsError(MIN_CARDS, cards.length);
    }
    const [first, ...rest] = shuffle(cards);
    if (first === undefined) {
      throw new NotEnoughCardsError(MIN_CARDS, 0);
    }
    return new Run(id, "in_progress", ownerId, [first], rest.slice(0, HAND_SIZE), rest.slice(HAND_SIZE), []);
  }

  /** Reconstitue un run déjà démarré (lecture depuis la persistance). */
  static restore(state: RunState): Run {
    return new Run(
      state.id,
      state.status,
      state.ownerId ?? null,
      state.timeline,
      state.hand,
      state.drawPile,
      state.discard,
    );
  }

  /**
   * Une partie d'invité est ouverte à tous ; une partie avec propriétaire n'est accessible qu'à lui
   * (`playerId` : joueur connecté, ou `null` pour un invité).
   */
  isAccessibleBy(playerId: string | null): boolean {
    return this.ownerId === null || this.ownerId === playerId;
  }

  playCard({ cardId, position }: PlayCardInput): PlayResult {
    if (this.status === "won") {
      throw new RunAlreadyWonError();
    }
    const card = this.hand.find((candidate) => candidate.id === cardId);
    if (card === undefined) {
      throw new CardNotInHandError(cardId);
    }
    if (!Number.isInteger(position) || position < 0 || position > this.timeline.length) {
      throw new InvalidPositionError(position, this.timeline.length);
    }

    const remainingHand = this.hand.filter((candidate) => candidate.id !== cardId);

    if (this.isCorrectPlacement(card, position)) {
      const timeline = [...this.timeline.slice(0, position), card, ...this.timeline.slice(position)];
      const run = this.next({ timeline, hand: remainingHand });
      return { outcome: "correct", card, run };
    }

    const discard = [...this.discard, card];
    const [drawnCard, ...drawPile] = this.drawPile;
    const hand = drawnCard === undefined ? remainingHand : [...remainingHand, drawnCard];
    const run = this.next({ hand, drawPile, discard });
    return drawnCard === undefined
      ? { outcome: "incorrect", card, run }
      : { outcome: "incorrect", card, drawnCard, run };
  }

  private isCorrectPlacement(card: Card, position: number): boolean {
    const left = this.timeline[position - 1];
    const right = this.timeline[position];
    return (left === undefined || left.year <= card.year) && (right === undefined || card.year <= right.year);
  }

  private next(changes: Partial<Omit<RunState, "id" | "status" | "ownerId">>): Run {
    const hand = changes.hand ?? this.hand;
    return new Run(
      this.id,
      hand.length === 0 ? "won" : this.status,
      this.ownerId,
      changes.timeline ?? this.timeline,
      hand,
      changes.drawPile ?? this.drawPile,
      changes.discard ?? this.discard,
    );
  }
}
