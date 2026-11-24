import { describe, expect, it } from "vitest";
import { Card } from "@/features/cards";
import { NotEnoughCardsError } from "./errors";
import { Run, type Shuffle } from "./run";

const identity: Shuffle = (items) => [...items];
const reverse: Shuffle = (items) => [...items].reverse();

function makeCards(count: number): Card[] {
  return Array.from({ length: count }, (_, index) =>
    Card.create({ id: `card-${index + 1}`, title: `Event ${index + 1}`, year: 1000 + index }),
  );
}

const ids = (cards: readonly Card[]) => cards.map((card) => card.id);

describe("Run.start", () => {
  it("puts the first card on the timeline, deals 10 to the hand and keeps the rest as draw pile", () => {
    const run = Run.start({ id: "run-1", cards: makeCards(100), shuffle: identity });

    expect(ids(run.timeline)).toEqual(["card-1"]);
    expect(ids(run.hand)).toEqual(Array.from({ length: 10 }, (_, i) => `card-${i + 2}`));
    expect(run.drawPile).toHaveLength(89);
    expect(run.drawPile[0]?.id).toBe("card-12");
    expect(run.discard).toHaveLength(0);
  });

  it("starts in progress", () => {
    expect(Run.start({ id: "run-1", cards: makeCards(11), shuffle: identity }).status).toBe("in_progress");
  });

  it("uses the injected shuffle to order the deck", () => {
    const run = Run.start({ id: "run-1", cards: makeCards(100), shuffle: reverse });

    expect(ids(run.timeline)).toEqual(["card-100"]);
    expect(run.hand[0]?.id).toBe("card-99");
  });

  it("does not mutate the cards it is given", () => {
    const cards = makeCards(20);
    const before = ids(cards);

    Run.start({ id: "run-1", cards, shuffle: reverse });

    expect(ids(cards)).toEqual(before);
  });

  it("accepts exactly 11 cards, leaving an empty draw pile", () => {
    const run = Run.start({ id: "run-1", cards: makeCards(11), shuffle: identity });

    expect(run.hand).toHaveLength(10);
    expect(run.drawPile).toHaveLength(0);
  });

  it("rejects fewer than 11 cards", () => {
    expect(() => Run.start({ id: "run-1", cards: makeCards(10), shuffle: identity })).toThrow(
      NotEnoughCardsError,
    );
  });
});
