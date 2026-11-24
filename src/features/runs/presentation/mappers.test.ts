import { describe, expect, it } from "vitest";
import { Card } from "@/features/cards";
import { Run } from "../domain/run";
import { toPlayResponse, toRunResponse } from "./mappers";
import { hiddenCardSchema, playRequestSchema, runResponseSchema } from "./schemas";

const card = (id: string, year: number, category?: string) => Card.create({ id, title: `Event ${id}`, year, category });

// Années volontairement reconnaissables pour chercher une fuite dans le JSON.
const HAND_YEAR = 1234;
const PILE_YEAR = 4321;

const run = Run.restore({
  id: "run-1",
  status: "in_progress",
  timeline: [card("t1", 1000), card("t2", 1100, "historical")],
  hand: [card("h1", HAND_YEAR), card("h2", 1500)],
  drawPile: [card("d1", PILE_YEAR), card("d2", 4322)],
  discard: [card("x1", 777)],
});

describe("toRunResponse", () => {
  it("shows dates of timeline and discard only", () => {
    const response = toRunResponse(run);

    expect(response.timeline.map((c) => c.year)).toEqual([1000, 1100]);
    expect(response.discard.map((c) => c.year)).toEqual([777]);
  });

  it("never exposes the date of a card in the hand or the draw pile", () => {
    const json = JSON.stringify(toRunResponse(run));

    for (const hidden of [HAND_YEAR, PILE_YEAR, 1500, 4322]) {
      expect(json).not.toContain(String(hidden));
    }
    expect(toRunResponse(run).hand.every((c) => !("year" in c))).toBe(true);
  });

  it("does not list the draw pile, only its size", () => {
    const response = toRunResponse(run);

    expect(response.drawPileCount).toBe(2);
    expect(JSON.stringify(response)).not.toContain("d1");
  });

  it("keeps the optional category only when present", () => {
    const response = toRunResponse(run);

    expect(response.timeline[0]).not.toHaveProperty("category");
    expect(response.timeline[1]?.category).toBe("historical");
  });

  it("produces a response that satisfies the schema", () => {
    expect(() => runResponseSchema.parse(toRunResponse(run))).not.toThrow();
  });
});

describe("toPlayResponse", () => {
  it("reveals the played card and hides the drawn one", () => {
    const result = run.playCard({ cardId: "h2", position: 0 }); // 1500 avant 1000 : erreur
    const body = toPlayResponse(result);

    expect(body.outcome).toBe("incorrect");
    expect(body.card).toMatchObject({ id: "h2", year: 1500 });
    expect(body.drawnCard).toEqual({ id: "d1", title: "Event d1" });
    expect(JSON.stringify(body)).not.toContain(String(PILE_YEAR));
    expect(JSON.stringify(body)).not.toContain(String(HAND_YEAR));
  });

  it("omits drawnCard after a correct placement", () => {
    const body = toPlayResponse(run.playCard({ cardId: "h1", position: 2 }));

    expect(body.outcome).toBe("correct");
    expect(body).not.toHaveProperty("drawnCard");
  });
});

describe("schemas", () => {
  it("rejects a hidden card that carries a year", () => {
    expect(hiddenCardSchema.safeParse({ id: "a", title: "A", year: 1789 }).success).toBe(false);
  });

  it.each([
    [{ cardId: "a", position: 0 }, true],
    [{ cardId: "a", position: -1 }, false],
    [{ cardId: "a", position: 1.5 }, false],
    [{ cardId: "", position: 0 }, false],
    [{ cardId: "a" }, false],
    [{ cardId: "a", position: 0, extra: 1 }, false],
  ])("play request %j is valid: %s", (body, valid) => {
    expect(playRequestSchema.safeParse(body).success).toBe(valid);
  });
});
