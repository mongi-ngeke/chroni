import { describe, expect, it } from "vitest";
import { Card, InvalidCardError } from "./card";

const valid = { id: "card-1", title: "Prise de la Bastille", year: 1789 };

describe("Card.create", () => {
  it("creates a card from valid data", () => {
    const card = Card.create(valid);

    expect(card).toMatchObject({ id: "card-1", title: "Prise de la Bastille", year: 1789 });
  });

  it("trims the title", () => {
    expect(Card.create({ ...valid, title: "  Bastille  " }).title).toBe("Bastille");
  });

  it.each(["", "   "])("rejects an empty title (%j)", (title) => {
    expect(() => Card.create({ ...valid, title })).toThrow(InvalidCardError);
  });

  it("accepts a negative year (before the common era)", () => {
    expect(Card.create({ ...valid, year: -490 }).year).toBe(-490);
  });

  it("rejects year 0, which does not exist in the historical calendar", () => {
    expect(() => Card.create({ ...valid, year: 0 })).toThrow(InvalidCardError);
  });

  it.each([1789.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects a non-integer year (%s)", (year) => {
    expect(() => Card.create({ ...valid, year })).toThrow(InvalidCardError);
  });

  it("keeps an optional category", () => {
    expect(Card.create({ ...valid, category: "historical" }).category).toBe("historical");
    expect(Card.create(valid).category).toBeUndefined();
  });
});
