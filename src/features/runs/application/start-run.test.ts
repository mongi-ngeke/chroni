import { describe, expect, it } from "vitest";
import { buildCard } from "@tests/support/cards";
import { NotEnoughCardsError } from "../domain/errors";
import type { Shuffle } from "../domain/run";
import { startRun } from "./start-run";
import { InMemoryCardRepository, InMemoryRunRepository, SequentialIdGenerator } from "./testing/in-memory";

const reverse: Shuffle = (items) => [...items].reverse();

const makeCards = (count: number) =>
  Array.from({ length: count }, (_, i) => buildCard({ id: `card-${i + 1}`, year: 1000 + i }));

function setup(cardCount: number) {
  const runs = new InMemoryRunRepository();
  const deps = {
    runs,
    cards: new InMemoryCardRepository(makeCards(cardCount)),
    shuffle: reverse,
    ids: new SequentialIdGenerator(),
  };
  return { runs, deps };
}

describe("startRun", () => {
  it("starts a run from all cards with the injected shuffle and id", async () => {
    const { deps } = setup(100);

    const run = await startRun(deps, null);

    expect(run.id).toBe("run-1");
    expect(run.timeline.map((c) => c.id)).toEqual(["card-100"]);
    expect(run.hand).toHaveLength(10);
    expect(run.drawPile).toHaveLength(89);
  });

  it("persists the run", async () => {
    const { runs, deps } = setup(100);

    const run = await startRun(deps, null);

    expect(await runs.findById(run.id)).toBe(run);
  });

  it("starts a guest run without a player, and a private run for a logged-in player", async () => {
    const { deps } = setup(100);

    expect((await startRun(deps, null)).ownerId).toBeNull();
    expect((await startRun(deps, "user-1")).ownerId).toBe("user-1");
  });

  it("fails without persisting when there are not enough cards", async () => {
    const { runs, deps } = setup(10);

    await expect(startRun(deps, null)).rejects.toThrow(NotEnoughCardsError);
    expect(runs.saved.size).toBe(0);
  });
});
