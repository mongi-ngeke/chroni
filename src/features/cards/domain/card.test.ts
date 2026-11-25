import { describe, expect, it } from "vitest";
import { Card, InvalidCardError, type CardProps } from "./card";

const image = {
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
  alt: "Une prison prise d'assaut",
  credit: "Auteur — CC0, via Wikimedia Commons",
};
const valid: CardProps = {
  id: "card-1",
  title: "Prise de la Bastille",
  year: 1789,
  description: "Une forteresse parisienne est prise par la foule lors d'une journée de grande agitation.",
  image,
};
const create = (changes: Partial<CardProps>) => Card.create({ ...valid, ...changes });
const withImage = (changes: Partial<typeof image>) => create({ image: { ...image, ...changes } });

describe("Card.create", () => {
  it("creates a card from valid data", () => {
    const card = Card.create(valid);

    expect(card).toMatchObject({ id: "card-1", title: "Prise de la Bastille", year: 1789, image });
    expect(card.description).toBe(valid.description);
  });

  it("trims the title and the description", () => {
    const card = create({ title: "  Bastille  ", description: "  Un texte.  " });

    expect(card.title).toBe("Bastille");
    expect(card.description).toBe("Un texte.");
  });

  it.each(["", "   "])("rejects an empty title (%j)", (title) => {
    expect(() => create({ title })).toThrow(InvalidCardError);
  });

  it.each(["", "   "])("rejects an empty description (%j)", (description) => {
    expect(() => create({ description })).toThrow(InvalidCardError);
  });

  it("accepts a negative year (before the common era)", () => {
    expect(create({ year: -490 }).year).toBe(-490);
  });

  it("rejects year 0, which does not exist in the historical calendar", () => {
    expect(() => create({ year: 0 })).toThrow(InvalidCardError);
  });

  it.each([1789.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects a non-integer year (%s)", (year) => {
    expect(() => create({ year })).toThrow(InvalidCardError);
  });

  it("keeps an optional category", () => {
    expect(create({ category: "historical" }).category).toBe("historical");
    expect(create({}).category).toBeUndefined();
  });
});

describe("Card image", () => {
  it.each(["http://upload.wikimedia.org/a.jpg", "ftp://example.org/a.jpg", "not a url", "", "//example.org/a.jpg"])(
    "rejects a url that is not https (%j)",
    (url) => {
      expect(() => withImage({ url })).toThrow(InvalidCardError);
    },
  );

  it.each([["alt"], ["credit"]] as const)("rejects an empty %s", (field) => {
    expect(() => withImage({ [field]: "  " })).toThrow(InvalidCardError);
  });

  it("trims the alt text and the credit", () => {
    const card = withImage({ alt: "  Une image  ", credit: "  Moi  " });

    expect(card.image.alt).toBe("Une image");
    expect(card.image.credit).toBe("Moi");
  });
});

// Description et image sont visibles dès la main : aucune ne doit contenir l'année de la carte.
describe("Card date leaks", () => {
  it("rejects a description that contains the year", () => {
    expect(() => create({ description: "Un événement survenu en 1789 à Paris." })).toThrow(InvalidCardError);
    expect(() => create({ description: "1789" })).toThrow(InvalidCardError);
  });

  it("uses the absolute value of the year for cards before the common era", () => {
    expect(() => create({ year: -490, description: "Une bataille livrée en 490 par les Athéniens." })).toThrow(
      InvalidCardError,
    );
  });

  it("accepts a number that merely contains the year", () => {
    expect(() => create({ description: "Le comité compte 117890 membres et 21789 sièges." })).not.toThrow();
  });

  it("rejects an alt text that contains the year", () => {
    expect(() => withImage({ alt: "Tableau de 1789" })).toThrow(InvalidCardError);
  });

  it("rejects an image whose file name contains the year, even url-encoded", () => {
    const base = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc";
    expect(() => withImage({ url: `${base}/Bastille_1789.jpg/960px-Bastille_1789.jpg` })).toThrow(InvalidCardError);
    expect(() => withImage({ url: `${base}/Bastille_%281789%29.jpg/960px-Bastille_%281789%29.jpg` })).toThrow(
      InvalidCardError,
    );
  });

  it("ignores the directory hashes and the thumbnail size prefix of the url", () => {
    const colosseum = Card.create({
      ...valid,
      year: 80,
      image: { ...image, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Colosseum.jpg/960px-Colosseum.jpg" },
    });
    const tenthCentury = Card.create({ ...valid, year: 960, image });

    expect(colosseum.year).toBe(80);
    expect(tenthCentury.year).toBe(960);
  });
});
