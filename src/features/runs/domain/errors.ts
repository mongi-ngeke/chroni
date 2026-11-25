import { DomainError } from "@/shared/domain-error";

/** Erreur métier de la feature runs, avec un code stable repris tel quel par l'API. */
export abstract class RunError extends DomainError {}

export class NotEnoughCardsError extends RunError {
  readonly code = "NOT_ENOUGH_CARDS";

  constructor(required: number, available: number) {
    super(`A run needs at least ${required} cards, got ${available}`);
  }
}

export class RunAlreadyWonError extends RunError {
  readonly code = "RUN_ALREADY_WON";

  constructor() {
    super("This run is already won");
  }
}

export class CardNotInHandError extends RunError {
  readonly code = "CARD_NOT_IN_HAND";

  constructor(cardId: string) {
    super(`Card ${cardId} is not in the hand`);
  }
}

export class InvalidPositionError extends RunError {
  readonly code = "INVALID_POSITION";

  constructor(position: number, timelineLength: number) {
    super(`Position ${position} is invalid: expected an integer between 0 and ${timelineLength}`);
  }
}
