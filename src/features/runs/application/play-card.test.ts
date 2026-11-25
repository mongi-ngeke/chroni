import { beforeEach, describe, expect, it } from "vitest";
import { buildCard } from "@tests/support/cards";
import { CardNotInHandError } from "../domain/errors";
import { Run } from "../domain/run";
import { RunNotFoundError } from "./errors";
import { getRun } from "./get-run";
import { playCard } from "./play-card";
import { InMemoryRunRepository } from "./testing/in-memory";

const card = (id: string, year: number) => buildCard({ id, year });

let runs: InMemoryRunRepository;
let initial: Run;

beforeEach(async () => {
  runs = new InMemoryRunRepository();
  initial = Run.restore({
    id: "run-1",
    status: "in_progress",
    timeline: [card("t1", 1000)],
    hand: [card("good", 1500), card("bad", 500), card("other", 1200)],
    drawPile: [card("d1", 1)],
    discard: [],
  });
  await runs.save(initial);
});

describe("playCard", () => {
  it("persists the new state after a correct placement", async () => {
    const result = await playCard({ runs }, { runId: "run-1", playerId: null, cardId: "good", position: 1 });

    expect(result.outcome).toBe("correct");
    expect((await runs.findById("run-1"))?.timeline.map((c) => c.id)).toEqual(["t1", "good"]);
  });

  it("persists the discard and the draw after a misplacement, and reveals the card", async () => {
    const result = await playCard({ runs }, { runId: "run-1", playerId: null, cardId: "bad", position: 1 });

    expect(result.outcome).toBe("incorrect");
    expect(result.card.year).toBe(500);
    const saved = await runs.findById("run-1");
    expect(saved?.discard.map((c) => c.id)).toEqual(["bad"]);
    expect(saved?.hand.map((c) => c.id)).toContain("d1");
  });

  it("fails when the run does not exist", async () => {
    await expect(playCard({ runs }, { runId: "nope", playerId: null, cardId: "good", position: 0 })).rejects.toThrow(
      RunNotFoundError,
    );
  });

  it("propagates domain errors and keeps the stored run unchanged", async () => {
    await expect(playCard({ runs }, { runId: "run-1", playerId: null, cardId: "t1", position: 0 })).rejects.toThrow(
      CardNotInHandError,
    );
    expect(await runs.findById("run-1")).toBe(initial);
  });
});

describe("getRun", () => {
  it("returns the stored run", async () => {
    expect(await getRun({ runs }, "run-1", null)).toBe(initial);
  });

  it("fails with RUN_NOT_FOUND for an unknown id", async () => {
    await expect(getRun({ runs }, "nope", null)).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
  });

  it("opens a guest run to anyone, logged in or not", async () => {
    expect(await getRun({ runs }, "run-1", null)).toBe(initial);
    expect(await getRun({ runs }, "run-1", "user-1")).toBe(initial);
  });
});

describe("private runs", () => {
  beforeEach(async () => {
    await runs.save(
      Run.restore({
        id: "private",
        status: "in_progress",
        ownerId: "owner",
        timeline: [card("t1", 1000)],
        hand: [card("good", 1500)],
        drawPile: [],
        discard: [],
      }),
    );
  });

  it("are found and played by their owner", async () => {
    expect((await getRun({ runs }, "private", "owner")).ownerId).toBe("owner");
    const result = await playCard({ runs }, { runId: "private", playerId: "owner", cardId: "good", position: 1 });

    expect(result.outcome).toBe("correct");
  });

  it("are not found by a guest or another player, as if they did not exist", async () => {
    for (const playerId of [null, "intruder"]) {
      await expect(getRun({ runs }, "private", playerId)).rejects.toThrow(RunNotFoundError);
      await expect(
        playCard({ runs }, { runId: "private", playerId, cardId: "good", position: 1 }),
      ).rejects.toThrow(RunNotFoundError);
    }
    expect((await runs.findById("private"))?.hand.map((c) => c.id)).toEqual(["good"]);
  });
});
