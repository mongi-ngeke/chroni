import { describe, expect, it } from "vitest";
import { buildCard } from "@tests/support/cards";
import type { CardRepository } from "./card-repository";
import { listCardCredits } from "./list-card-credits";

function repositoryOf(...cards: ReturnType<typeof buildCard>[]): CardRepository {
  return { findAll: async () => cards, findByIds: async () => [] };
}

const withCredit = (id: string, title: string, year: number, credit: string) =>
  buildCard({
    id,
    title,
    year,
    image: { url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg", alt: "Une image", credit },
  });

describe("listCardCredits", () => {
  it("returns the title and the credit of every card", async () => {
    const cards = repositoryOf(withCredit("c1", "Bastille", 1789, "Auteur A — CC0, via Wikimedia Commons"));

    expect(await listCardCredits({ cards })).toEqual([
      { cardId: "c1", title: "Bastille", credit: "Auteur A — CC0, via Wikimedia Commons" },
    ]);
  });

  it("sorts by title, whatever the chronological order", async () => {
    const cards = repositoryOf(
      withCredit("c1", "Waterloo", 1815, "x — CC0, via Wikimedia Commons"),
      withCredit("c2", "Marathon", -490, "y — CC0, via Wikimedia Commons"),
      withCredit("c3", "Éruption du Vésuve", 79, "z — CC0, via Wikimedia Commons"),
    );

    const titles = (await listCardCredits({ cards })).map((c) => c.title);

    expect(titles).toEqual(["Éruption du Vésuve", "Marathon", "Waterloo"]);
  });

  it("never exposes the year of a card", async () => {
    const cards = repositoryOf(withCredit("c1", "Bastille", 1789, "Auteur — CC0, via Wikimedia Commons"));

    expect(JSON.stringify(await listCardCredits({ cards }))).not.toContain("1789");
  });
});
