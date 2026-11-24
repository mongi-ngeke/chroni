/** Erreur métier avec un code stable, repris tel quel par l'API. */
export abstract class RunError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotEnoughCardsError extends RunError {
  readonly code = "NOT_ENOUGH_CARDS";

  constructor(required: number, available: number) {
    super(`A run needs at least ${required} cards, got ${available}`);
  }
}
