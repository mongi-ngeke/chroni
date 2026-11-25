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

// Description, image et alt sont visibles dès la main : aucun ne doit trahir la date.
const YEAR_LIKE = /(?<!\d)\d{3,4}(?!\d)/;
const CENTURY = /si[eè]cle|century|jahrhundert|\d(st|nd|rd|th)[ _-]/i;
const SPELLED_YEAR = /mille|cento|quattro|thousand/i;

/** Nom de fichier décodé, sans le préfixe de taille de la miniature (960px-). */
function fileName(url: string): string {
  const last = decodeURIComponent(url.split("/").pop() ?? "");
  return last.replace(/^(page\d+-)?\d+px-/, "");
}

describe("seed card content", () => {
  it.each(seedCards.map((seed) => [seed.title, seed] as const))("%s: description is 3 to 5 sentences of 300-600 characters", (_title, seed) => {
    const sentences = seed.description.trim().split(/(?<=[.!?])\s+/);

    expect(seed.description.length).toBeGreaterThanOrEqual(300);
    expect(seed.description.length).toBeLessThanOrEqual(600);
    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences.length).toBeLessThanOrEqual(5);
  });

  it("never reveals the date in the description or the alt text", () => {
    for (const { title, year, description, image } of seedCards) {
      for (const text of [description, image.alt]) {
        expect(text, title).not.toMatch(/\d/);
        expect(text, title).not.toMatch(CENTURY);
      }
      expect(description, title).not.toContain(String(Math.abs(year)));
    }
  });

  it("never reveals the date in the image file name", () => {
    for (const { title, year, image } of seedCards) {
      const name = fileName(image.url);
      expect(name, title).not.toMatch(YEAR_LIKE);
      expect(name, title).not.toMatch(CENTURY);
      expect(name, title).not.toMatch(SPELLED_YEAR);
      expect(name, title).not.toMatch(new RegExp(`(?<!\\d)${Math.abs(year)}(?!\\d)`));
    }
  });

  it("uses https Wikimedia Commons images, each with an alt text and a credit", () => {
    for (const { title, image } of seedCards) {
      expect(image.url, title).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
      expect(image.alt.trim(), title).not.toBe("");
      expect(image.credit, title).toMatch(/Wikimedia Commons$/);
    }
    expect(new Set(seedCards.map((s) => s.image.url)).size).toBe(100);
  });
});

describe("seedCardId", () => {
  it("slugifies accents and punctuation", () => {
    expect(seedCardId("Prise de la Bastille")).toBe("prise-de-la-bastille");
    expect(seedCardId("L'Étranger d'Albert Camus")).toBe("l-etranger-d-albert-camus");
  });
});
