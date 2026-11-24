export class InvalidCardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCardError";
  }
}

export interface CardProps {
  id: string;
  title: string;
  /** Année historique : négative avant J.-C., jamais 0 (il n'y a pas d'année 0). */
  year: number;
  category?: string | undefined;
}

export class Card {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly year: number,
    readonly category: string | undefined,
  ) {}

  static create(props: CardProps): Card {
    const title = props.title.trim();
    if (title === "") {
      throw new InvalidCardError("Card title must not be empty");
    }
    if (!Number.isInteger(props.year) || props.year === 0) {
      throw new InvalidCardError("Card year must be a non-zero integer");
    }
    return new Card(props.id, title, props.year, props.category);
  }
}
