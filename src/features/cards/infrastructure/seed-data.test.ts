import { describe, expect, it } from "vitest";
import { Card } from "../domain/card";
import { seedCardId, seedCards } from "./seed-data";

describe("seed data", () => {
  it("contains exactly the 100 cards of a deck", () => {
    expect(seedCards).toHaveLength(100);
  });

  it("only holds cards valid for the domain", () => {
    for (const seed of seedCards) {
      expect(() => Card.create({ id: seedCardId(seed.title), ...seed })).not.toThrow();
    }
  });

  it("has unique ids and unique years, so no placement is ambiguous", () => {
    expect(new Set(seedCards.map((s) => seedCardId(s.title))).size).toBe(100);
    expect(new Set(seedCards.map((s) => s.year)).size).toBe(100);
  });

  it("never gives the date away in a title", () => {
    for (const seed of seedCards) {
      expect(seed.title, seed.title).not.toMatch(/\d{3,4}/);
    }
  });

  it("mixes historical and cultural cards, including before the common era", () => {
    expect(seedCards.some((s) => s.category === "historical")).toBe(true);
    expect(seedCards.some((s) => s.category === "cultural")).toBe(true);
    expect(seedCards.some((s) => s.year < 0)).toBe(true);
  });
});

describe("seedCardId", () => {
  it("slugifies accents and punctuation", () => {
    expect(seedCardId("Prise de la Bastille")).toBe("prise-de-la-bastille");
    expect(seedCardId("L'Étranger d'Albert Camus")).toBe("l-etranger-d-albert-camus");
  });
});
