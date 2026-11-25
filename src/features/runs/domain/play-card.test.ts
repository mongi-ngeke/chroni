import { describe, expect, it } from "vitest";
import type { Card } from "@/features/cards";
import { buildCard } from "@tests/support/cards";
import { CardNotInHandError, InvalidPositionError, RunAlreadyWonError } from "./errors";
import { Run } from "./run";

const card = (id: string, year: number) => buildCard({ id, year });
const ids = (cards: readonly Card[]) => cards.map((c) => c.id);

interface Setup {
  timeline?: Card[];
  hand?: Card[];
  drawPile?: Card[];
  discard?: Card[];
  status?: "in_progress" | "won";
}

function runWith(setup: Setup): Run {
  return Run.restore({
    id: "run-1",
    status: setup.status ?? "in_progress",
    timeline: setup.timeline ?? [card("t1", 1000), card("t2", 1100)],
    hand: setup.hand ?? [],
    drawPile: setup.drawPile ?? [],
    discard: setup.discard ?? [],
  });
}

describe("Run.playCard — correct placement", () => {
  const hand = [card("a", 900), card("b", 1050), card("c", 1200), card("x", 1500)];

  it.each([
    ["at the start", "a", 0, ["a", "t1", "t2"]],
    ["in the middle", "b", 1, ["t1", "b", "t2"]],
    ["at the end", "c", 2, ["t1", "t2", "c"]],
  ])("accepts a card placed %s", (_label, cardId, position, expected) => {
    const result = runWith({ hand }).playCard({ cardId, position });

    expect(result.outcome).toBe("correct");
    expect(ids(result.run.timeline)).toEqual(expected);
    expect(ids(result.run.hand)).not.toContain(cardId);
    expect(result.run.hand).toHaveLength(3);
  });

  it("accepts equal years on either side", () => {
    const run = runWith({ hand: [card("same", 1000), card("same2", 1100)] });

    expect(run.playCard({ cardId: "same", position: 0 }).outcome).toBe("correct");
    expect(run.playCard({ cardId: "same", position: 1 }).outcome).toBe("correct");
    expect(run.playCard({ cardId: "same2", position: 1 }).outcome).toBe("correct");
    expect(run.playCard({ cardId: "same2", position: 2 }).outcome).toBe("correct");
  });

  it("orders negative years (before the common era)", () => {
    const run = runWith({
      timeline: [card("bc", -500), card("ad", 100)],
      hand: [card("mid", -44), card("older", -3000), card("x", 1)],
    });

    expect(run.playCard({ cardId: "mid", position: 1 }).outcome).toBe("correct");
    expect(run.playCard({ cardId: "older", position: 0 }).outcome).toBe("correct");
    expect(run.playCard({ cardId: "older", position: 1 }).outcome).toBe("incorrect");
  });

  it("does not draw and keeps the draw pile and discard untouched", () => {
    const result = runWith({ hand, drawPile: [card("d1", 1)], discard: [card("old", 2)] }).playCard({
      cardId: "b",
      position: 1,
    });

    expect(ids(result.run.drawPile)).toEqual(["d1"]);
    expect(ids(result.run.discard)).toEqual(["old"]);
    expect(result.drawnCard).toBeUndefined();
  });

  it("returns the played card so its date can be revealed", () => {
    const result = runWith({ hand }).playCard({ cardId: "b", position: 1 });

    expect(result.card).toMatchObject({ id: "b", year: 1050 });
  });
});

describe("Run.playCard — placement error", () => {
  const hand = [card("a", 1500), card("b", 1050)];

  it("discards the card and draws the top card of the draw pile", () => {
    const result = runWith({ hand, drawPile: [card("d1", 1), card("d2", 2)] }).playCard({
      cardId: "a",
      position: 0,
    });

    expect(result.outcome).toBe("incorrect");
    expect(result.card.year).toBe(1500);
    expect(ids(result.run.timeline)).toEqual(["t1", "t2"]);
    expect(ids(result.run.discard)).toEqual(["a"]);
    expect(result.drawnCard?.id).toBe("d1");
    expect(ids(result.run.hand)).toEqual(["b", "d1"]);
    expect(ids(result.run.drawPile)).toEqual(["d2"]);
  });

  it("appends to the existing discard", () => {
    const result = runWith({ hand, drawPile: [card("d1", 1)], discard: [card("old", 2)] }).playCard({
      cardId: "a",
      position: 0,
    });

    expect(ids(result.run.discard)).toEqual(["old", "a"]);
  });

  it("with an empty draw pile, the card is lost and the hand shrinks", () => {
    const result = runWith({ hand }).playCard({ cardId: "a", position: 0 });

    expect(result.outcome).toBe("incorrect");
    expect(result.drawnCard).toBeUndefined();
    expect(ids(result.run.hand)).toEqual(["b"]);
    expect(ids(result.run.discard)).toEqual(["a"]);
    expect(result.run.status).toBe("in_progress");
  });
});

describe("Run.playCard — victory", () => {
  it("wins when the last card is placed correctly", () => {
    const result = runWith({ hand: [card("a", 1050)] }).playCard({ cardId: "a", position: 1 });

    expect(result.run.status).toBe("won");
    expect(result.run.hand).toHaveLength(0);
  });

  it("wins when the last card is misplaced and the draw pile is empty", () => {
    const result = runWith({ hand: [card("a", 1500)] }).playCard({ cardId: "a", position: 0 });

    expect(result.outcome).toBe("incorrect");
    expect(result.run.status).toBe("won");
  });

  it("does not win when a misplaced last card is replaced by a draw", () => {
    const result = runWith({ hand: [card("a", 1500)], drawPile: [card("d1", 1)] }).playCard({
      cardId: "a",
      position: 0,
    });

    expect(result.run.status).toBe("in_progress");
    expect(ids(result.run.hand)).toEqual(["d1"]);
  });

  it("refuses any further play once won", () => {
    const run = runWith({ status: "won", hand: [] });

    expect(() => run.playCard({ cardId: "a", position: 0 })).toThrow(RunAlreadyWonError);
  });
});

describe("Run.playCard — invalid input", () => {
  const run = runWith({ hand: [card("a", 1050)] });

  it("rejects a card that is not in the hand", () => {
    expect(() => run.playCard({ cardId: "t1", position: 0 })).toThrow(CardNotInHandError);
    expect(() => run.playCard({ cardId: "unknown", position: 0 })).toThrow(CardNotInHandError);
  });

  it.each([-1, 3, 1.5, Number.NaN])("rejects position %s", (position) => {
    expect(() => run.playCard({ cardId: "a", position })).toThrow(InvalidPositionError);
  });

  it("does not mutate the run it is called on", () => {
    run.playCard({ cardId: "a", position: 1 });

    expect(ids(run.hand)).toEqual(["a"]);
    expect(ids(run.timeline)).toEqual(["t1", "t2"]);
    expect(run.status).toBe("in_progress");
  });
});
