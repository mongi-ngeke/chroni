import { ApiError, type RunsApi } from "./api-client";
import type { HiddenCard, PlayResponse, RevealedCard, RunResponse } from "./schemas";

// Logique de l'écran de jeu, sans React ni réseau direct : testable seule.
// L'ordre de la main est celui reçu du serveur (le serveur ne l'impose ni ne le stocke).

export interface Feedback {
  outcome: "correct" | "incorrect";
  /** La carte jouée, date révélée. */
  card: RevealedCard;
  /** Carte piochée après une erreur (date masquée) ; absente si la pioche était vide. */
  drawnCard?: HiddenCard | undefined;
}

export interface GameState {
  run: RunResponse;
  selectedCardId: string | null;
  pending: boolean;
  feedback: Feedback | null;
  error: string | null;
}

export type GameAction =
  | { type: "select"; cardId: string }
  | { type: "playStarted" }
  | { type: "playSucceeded"; result: PlayResponse }
  | { type: "playFailed"; error: unknown }
  | { type: "dismissFeedback" };

export function initialGameState(run: RunResponse): GameState {
  return { run, selectedCardId: null, pending: false, feedback: null, error: null };
}

export function canPlay(state: GameState): boolean {
  return state.selectedCardId !== null && !state.pending && state.run.status === "in_progress";
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "select": {
      const inHand = state.run.hand.some((card) => card.id === action.cardId);
      if (state.pending || state.run.status === "won" || !inHand) {
        return state;
      }
      return { ...state, selectedCardId: state.selectedCardId === action.cardId ? null : action.cardId };
    }
    case "playStarted":
      return { ...state, pending: true, error: null };
    case "playSucceeded": {
      const { result } = action;
      const feedback: Feedback =
        result.drawnCard === undefined
          ? { outcome: result.outcome, card: result.card }
          : { outcome: result.outcome, card: result.card, drawnCard: result.drawnCard };
      return { run: result.run, selectedCardId: null, pending: false, feedback, error: null };
    }
    case "playFailed": {
      const code = action.error instanceof ApiError ? action.error.code : "UNKNOWN";
      // La carte n'est plus jouable : inutile de la garder sélectionnée.
      const stale = code === "CARD_NOT_IN_HAND" || code === "RUN_ALREADY_WON";
      return { ...state, pending: false, selectedCardId: stale ? null : state.selectedCardId, error: errorMessage(code) };
    }
    case "dismissFeedback":
      return { ...state, feedback: null };
  }
}

/** Joue la carte sélectionnée à `position` ; ne fait rien si le coup n'est pas permis (double clic). */
export async function playSelectedCard(
  api: RunsApi,
  state: GameState,
  position: number,
  dispatch: (action: GameAction) => void,
): Promise<void> {
  if (state.selectedCardId === null || !canPlay(state)) {
    return;
  }
  dispatch({ type: "playStarted" });
  try {
    const result = await api.playCard(state.run.id, { cardId: state.selectedCardId, position });
    dispatch({ type: "playSucceeded", result });
  } catch (error) {
    dispatch({ type: "playFailed", error });
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  RUN_NOT_FOUND: "Cette partie est introuvable.",
  CARD_NOT_IN_HAND: "Cette carte n'est plus dans votre main.",
  INVALID_POSITION: "Cet emplacement n'est pas valide.",
  RUN_ALREADY_WON: "Cette partie est déjà gagnée.",
  NETWORK_ERROR: "Le serveur est injoignable. Vérifiez votre connexion et réessayez.",
};

export function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Une erreur inattendue est survenue. Réessayez.";
}

export function formatYear(year: number): string {
  return year < 0 ? `${-year} av. J.-C.` : String(year);
}

export function describeFeedback(feedback: Feedback): string {
  const date = `« ${feedback.card.title} » date de ${formatYear(feedback.card.year)}.`;
  if (feedback.outcome === "correct") {
    return `Bien joué ! ${date}`;
  }
  const consequence =
    feedback.drawnCard === undefined
      ? "La pioche est épuisée : la carte est perdue."
      : "Vous piochez une nouvelle carte.";
  return `Raté ! ${date} ${consequence}`;
}

export function poolMessage(run: RunResponse): string {
  if (run.status === "won") {
    return "";
  }
  if (run.drawPileCount === 0) {
    return "Pioche épuisée : jouez vos dernières cartes.";
  }
  return run.drawPileCount === 1 ? "1 carte dans la pioche" : `${run.drawPileCount} cartes dans la pioche`;
}

/** « 0 carte », « 1 carte », « 2 cartes » : le pluriel français commence à 2. */
export function cardCount(count: number): string {
  return count > 1 ? `${count} cartes` : `${count} carte`;
}

/** Écart maximal entre deux cartes voisines de l'éventail, et ouverture totale maximale (degrés) : resserrée,
    car des cartes hautes très inclinées déborderaient de l'écran. */
const FAN_MAX_STEP = 4;
const FAN_MAX_SPREAD = 24;
/** Descente des cartes vers les bords de l'éventail, en pixels par rang au carré. */
const FAN_DROP = 2;

export interface FanPosition {
  /** Rotation de la carte autour de son bord inférieur, en degrés (négatif à gauche). */
  angle: number;
  /** Décalage vers le bas, en pixels : les cartes du bord descendent pour dessiner un arc. */
  drop: number;
}

/** Position d'une carte dans l'éventail de la main : symétrique, centrée sur 0. */
export function fanPosition(index: number, count: number): FanPosition {
  if (count <= 1) {
    return { angle: 0, drop: 0 };
  }
  const step = Math.min(FAN_MAX_STEP, FAN_MAX_SPREAD / (count - 1));
  const rank = index - (count - 1) / 2;
  return { angle: rank * step, drop: rank * rank * FAN_DROP };
}
