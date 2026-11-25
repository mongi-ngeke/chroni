import { beforeEach, describe, expect, it } from "vitest";
import { GET as getRun } from "@/app/api/runs/[id]/route";
import { POST as playCard } from "@/app/api/runs/[id]/plays/route";
import { POST as startRun } from "@/app/api/runs/route";
import { seedCardsInto } from "@/features/cards/infrastructure/seed-cards";
import type { PlayResponse, RunResponse } from "@/features/runs/presentation/schemas";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const jsonRequest = (body: unknown) =>
  new Request("http://test.local", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

async function start(): Promise<RunResponse> {
  const response = await startRun();
  expect(response.status).toBe(201);
  return (await response.json()) as RunResponse;
}

async function play(runId: string, body: unknown): Promise<Response> {
  return playCard(jsonRequest(body), params(runId));
}

async function yearOf(cardId: string): Promise<number> {
  const row = await db.orm.public.Card.first({ id: cardId });
  if (row === null) throw new Error(`unknown card ${cardId}`);
  return row.year;
}

beforeEach(async () => {
  await resetDatabase();
  await seedCardsInto(db);
});

describe("POST /api/runs", () => {
  it("starts a run: 1 card on the timeline, 10 in hand, 89 in the draw pile", async () => {
    const run = await start();

    expect(run.status).toBe("in_progress");
    expect(run.timeline).toHaveLength(1);
    expect(run.hand).toHaveLength(10);
    expect(run.drawPileCount).toBe(89);
    expect(run.discard).toHaveLength(0);
  });

  it("never sends the date of a card in hand", async () => {
    const response = await startRun();
    const run = (await response.json()) as RunResponse;

    expect(run.hand.every((card) => !("year" in card))).toBe(true);
    expect(run.timeline[0]).toHaveProperty("year");
    // Une seule clé "year" dans tout le JSON : celle de la carte de départ posée sur la frise.
    const years = [...JSON.stringify(run).matchAll(/"year":(-?\d+)/g)].map((m) => Number(m[1]));
    expect(years).toEqual([run.timeline[0]?.year]);
  });

  it("sends the description and image of the cards in hand, without the image credit", async () => {
    const response = await startRun();
    const run = (await response.json()) as RunResponse;

    for (const card of run.hand) {
      expect(card.description.length).toBeGreaterThan(100);
      expect(card.image.url).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(card.image.alt).not.toBe("");
    }
    expect(JSON.stringify(run)).not.toContain("credit");
  });
});

describe("GET /api/runs/:id", () => {
  it("returns the stored run", async () => {
    const started = await start();

    const response = await getRun(new Request("http://test.local"), params(started.id));

    expect(response.status).toBe(200);
    const run = (await response.json()) as RunResponse;
    expect(run.id).toBe(started.id);
    expect(run.hand.map((c) => c.id).sort()).toEqual(started.hand.map((c) => c.id).sort());
  });

  it("returns 404 RUN_NOT_FOUND for an unknown run", async () => {
    const response = await getRun(new Request("http://test.local"), params("nope"));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "RUN_NOT_FOUND" });
  });
});

describe("POST /api/runs/:id/plays", () => {
  it("accepts a correct placement, reveals the card and removes it from the hand", async () => {
    const run = await start();
    const card = run.hand[0];
    const anchor = run.timeline[0];
    if (card === undefined || anchor === undefined) throw new Error("unexpected empty run");
    const year = await yearOf(card.id);
    const position = year >= anchor.year ? 1 : 0;

    const response = await play(run.id, { cardId: card.id, position });

    expect(response.status).toBe(200);
    const body = (await response.json()) as PlayResponse;
    expect(body.outcome).toBe("correct");
    expect(body.card).toMatchObject({ id: card.id, year });
    expect(body).not.toHaveProperty("drawnCard");
    expect(body.run.hand).toHaveLength(9);
    expect(body.run.timeline).toHaveLength(2);
  });

  it("on a misplacement, reveals the card, discards it and draws a hidden card", async () => {
    const run = await start();
    const card = run.hand[0];
    const anchor = run.timeline[0];
    if (card === undefined || anchor === undefined) throw new Error("unexpected empty run");
    const year = await yearOf(card.id);
    const wrongPosition = year >= anchor.year ? 0 : 1;

    const response = await play(run.id, { cardId: card.id, position: wrongPosition });

    const body = (await response.json()) as PlayResponse;
    expect(body.outcome).toBe("incorrect");
    expect(body.card.year).toBe(year);
    expect(body.drawnCard).toBeDefined();
    expect(body.drawnCard).not.toHaveProperty("year");
    expect(body.run.discard.map((c) => c.id)).toEqual([card.id]);
    expect(body.run.hand).toHaveLength(10);
    expect(body.run.drawPileCount).toBe(88);
  });

  it("persists the play", async () => {
    const run = await start();
    const card = run.hand[0];
    if (card === undefined) throw new Error("unexpected empty hand");
    await play(run.id, { cardId: card.id, position: 0 });

    const stored = (await (await getRun(new Request("http://test.local"), params(run.id))).json()) as RunResponse;

    expect(stored.hand.map((c) => c.id)).not.toContain(card.id);
  });

  it("returns 422 CARD_NOT_IN_HAND for a card the player does not hold", async () => {
    const run = await start();

    const response = await play(run.id, { cardId: "not-in-hand", position: 0 });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "CARD_NOT_IN_HAND" });
  });

  it("returns 422 INVALID_POSITION when the position is past the timeline", async () => {
    const run = await start();
    const card = run.hand[0];
    if (card === undefined) throw new Error("unexpected empty hand");

    const response = await play(run.id, { cardId: card.id, position: 5 });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "INVALID_POSITION" });
  });

  it("returns 404 for an unknown run", async () => {
    const response = await play("nope", { cardId: "a", position: 0 });

    expect(response.status).toBe(404);
  });

  it.each([
    ["not json", "{oops"],
    ["a missing position", { cardId: "a" }],
    ["a negative position", { cardId: "a", position: -1 }],
    ["an unknown field", { cardId: "a", position: 0, cheat: true }],
  ])("returns 400 INVALID_REQUEST for %s", async (_label, body) => {
    const run = await start();

    const response = await play(run.id, body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
  });
});
