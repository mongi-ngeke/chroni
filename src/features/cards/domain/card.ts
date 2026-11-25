export class InvalidCardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCardError";
  }
}

export interface CardImage {
  /** URL `https` ; son nom de fichier ne doit pas contenir l'année de la carte. */
  url: string;
  alt: string;
  /** Auteur et licence, affichés sur la page des crédits. */
  credit: string;
}

export interface CardProps {
  id: string;
  title: string;
  /** Année historique : négative avant J.-C., jamais 0 (il n'y a pas d'année 0). */
  year: number;
  category?: string | undefined;
  /** Visible dès la main : ne doit pas contenir l'année de la carte. */
  description: string;
  image: CardImage;
}

export class Card {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly year: number,
    readonly category: string | undefined,
    readonly description: string,
    readonly image: CardImage,
  ) {}

  static create(props: CardProps): Card {
    const title = props.title.trim();
    if (title === "") {
      throw new InvalidCardError("Card title must not be empty");
    }
    if (!Number.isInteger(props.year) || props.year === 0) {
      throw new InvalidCardError("Card year must be a non-zero integer");
    }
    const description = props.description.trim();
    if (description === "") {
      throw new InvalidCardError("Card description must not be empty");
    }
    const image = {
      url: props.image.url.trim(),
      alt: props.image.alt.trim(),
      credit: props.image.credit.trim(),
    };
    assertValidImage(image);

    // Description et image sont envoyées au client dès la main : aucune ne doit trahir la date.
    if (containsNumber(description, props.year) || containsNumber(image.alt, props.year)) {
      throw new InvalidCardError("Card description and image alt text must not contain the card year");
    }
    if (containsNumber(fileName(image.url), props.year)) {
      throw new InvalidCardError("Card image file name must not contain the card year");
    }
    return new Card(props.id, title, props.year, props.category, description, image);
  }
}

function assertValidImage(image: CardImage): void {
  let url: URL;
  try {
    url = new URL(image.url);
  } catch {
    throw new InvalidCardError("Card image url must be a valid url");
  }
  if (url.protocol !== "https:") {
    throw new InvalidCardError("Card image url must use https");
  }
  if (image.alt === "") {
    throw new InvalidCardError("Card image alt text must not be empty");
  }
  if (image.credit === "") {
    throw new InvalidCardError("Card image credit must not be empty");
  }
}

/** Vrai si `text` contient |year| comme nombre isolé (pas au milieu d'un nombre plus long). */
function containsNumber(text: string, year: number): boolean {
  return new RegExp(`(?<!\\d)${Math.abs(year)}(?!\\d)`).test(text);
}

/**
 * Nom de fichier décodé, sans le préfixe de taille des miniatures (`960px-`) :
 * le chemin contient des dossiers de hachage (`/8/80/`) qui ne sont pas des dates.
 */
function fileName(url: string): string {
  const last = url.split("?")[0]?.split("/").pop() ?? "";
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    // Séquence % invalide : on garde le texte brut, l'URL est de toute façon déjà acceptée.
  }
  return decoded.replace(/^(page\d+-)?\d+px-/, "");
}
