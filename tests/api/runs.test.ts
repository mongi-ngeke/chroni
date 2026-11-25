import { beforeEach, describe, expect, it } from "vitest";
import { GET as getRun } from "@/app/api/runs/[id]/route";
import { POST as playCard } from "@/app/api/runs/[id]/plays/route";
import { POST as startRun } from "@/app/api/runs/route";
import { SESSION_COOKIE } from "@/app/api/session-cookie";
import { POST as signUp } from "@/app/api/users/route";
import { seedCardsInto } from "@/features/cards/infrastructure/seed-cards";
import type { PlayResponse, RunResponse } from "@/features/runs/presentation/schemas";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
/** Requête d'un invité, ou d'un joueur connecté quand `cookie` est donné. */
const request = (method: string, cookie?: string, body?: unknown) =>
  new Request("http://test.local", {
    method,
    headers: cookie === undefined ? {} : { cookie },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
const jsonRequest = (body: unknown, cookie?: string) => request("POST", cookie, body);

async function start(cookie?: string): Promise<RunResponse> {
  const response = await startRun(request("POST", cookie));
  expect(response.status).toBe(201);
  return (await response.json()) as RunResponse;
}

async function play(runId: string, body: unknown, cookie?: string): Promise<Response> {
  return playCard(jsonRequest(body, cookie), params(runId));
}

/** Inscrit un joueur et renvoie son cookie de session, tel que le navigateur le renverra. */
async function playerCookie(email: string): Promise<string> {
  const response = await signUp(
    new Request("http://test.local", { method: "POST", body: JSON.stringify({ email, password: "correct horse" }) }),
  );
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (cookie === undefined || !cookie.startsWith(`${SESSION_COOKIE}=`)) throw new Error("no session cookie");
  return cookie;
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
    const response = await startRun(request("POST"));
    const run = (await response.json()) as RunResponse;

    expect(run.hand.every((card) => !("year" in card))).toBe(true);
    expect(run.timeline[0]).toHaveProperty("year");
    // Une seule clé "year" dans tout le JSON : celle de la carte de départ posée sur la frise.
    const years = [...JSON.stringify(run).matchAll(/"year":(-?\d+)/g)].map((m) => Number(m[1]));
    expect(years).toEqual([run.timeline[0]?.year]);
  });

  it("sends the description and image of the cards in hand, without the image credit", async () => {
    const response = await startRun(request("POST"));
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

describe("private runs", () => {
  const getAs = (runId: string, cookie?: string) => getRun(request("GET", cookie), params(runId));

  it("are started by a logged-in player and stored with their owner", async () => {
    const ada = await playerCookie("ada@example.org");

    const run = await start(ada);

    const row = await db.orm.public.Run.first({ id: run.id });
    const owner = await db.orm.public.User.first({ email: "ada@example.org" });
    expect(row?.userId).toBe(owner?.id);
  });

  it("are read and played by their owner", async () => {
    const ada = await playerCookie("ada@example.org");
    const run = await start(ada);
    const card = run.hand[0];
    if (card === undefined) throw new Error("empty hand");

    expect((await getAs(run.id, ada)).status).toBe(200);
    expect((await play(run.id, { cardId: card.id, position: 0 }, ada)).status).toBe(200);
  });

  it("answer 404 RUN_NOT_FOUND to a guest and to another player, and cannot be played by them", async () => {
    const ada = await playerCookie("ada@example.org");
    const grace = await playerCookie("grace@example.org");
    const run = await start(ada);
    const card = run.hand[0];
    if (card === undefined) throw new Error("empty hand");

    for (const cookie of [undefined, grace, `${SESSION_COOKIE}=forged`]) {
      const read = await getAs(run.id, cookie);
      expect(read.status).toBe(404);
      expect(await read.json()).toMatchObject({ code: "RUN_NOT_FOUND" });
      expect((await play(run.id, { cardId: card.id, position: 0 }, cookie)).status).toBe(404);
    }
    const stored = (await (await getAs(run.id, ada)).json()) as RunResponse;
    expect(stored.hand.map((c) => c.id)).toContain(card.id);
  });

  it("leave guest runs open to everybody, logged in or not", async () => {
    const run = await start();
    const ada = await playerCookie("ada@example.org");

    expect((await getAs(run.id)).status).toBe(200);
    expect((await getAs(run.id, ada)).status).toBe(200);
    expect((await db.orm.public.Run.first({ id: run.id }))?.userId).toBeNull();
  });
});
