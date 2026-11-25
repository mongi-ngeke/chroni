import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@tests/msw/server";
import { ApiError, createRunsApi } from "./api-client";
import type { PlayResponse, RunResponse } from "./schemas";
import { hidden, revealed } from "@tests/support/dto";

const BASE = "http://api.test";
const api = createRunsApi(BASE);

const run: RunResponse = {
  id: "run-1",
  status: "in_progress",
  timeline: [revealed("t1", "Start", 1000)],
  hand: [hidden("h1", "Hidden")],
  drawPileCount: 89,
  discard: [],
};

const playResponse: PlayResponse = { outcome: "correct", card: revealed("h1", "Hidden", 1100), run };

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to fail");
}

describe("startRun", () => {
  it("returns the parsed run", async () => {
    server.use(http.post(`${BASE}/api/runs`, () => HttpResponse.json(run, { status: 201 })));

    expect(await api.startRun()).toEqual(run);
  });

  it("fails with UNEXPECTED_RESPONSE when a hidden card leaks a year", async () => {
    const leaking = { ...run, hand: [revealed("h1", "Hidden", 1789)] };
    server.use(http.post(`${BASE}/api/runs`, () => HttpResponse.json(leaking, { status: 201 })));

    expect((await caught(api.startRun())).code).toBe("UNEXPECTED_RESPONSE");
  });

  it("fails with NETWORK_ERROR when the server is unreachable", async () => {
    server.use(http.post(`${BASE}/api/runs`, () => HttpResponse.error()));

    expect((await caught(api.startRun())).code).toBe("NETWORK_ERROR");
  });
});

describe("playCard", () => {
  it("posts the move as JSON and returns the parsed result", async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE}/api/runs/:id/plays`, async ({ request, params }) => {
        received = { id: params["id"], body: await request.json() };
        return HttpResponse.json(playResponse);
      }),
    );

    const result = await api.playCard("run-1", { cardId: "h1", position: 1 });

    expect(result).toEqual(playResponse);
    expect(received).toEqual({ id: "run-1", body: { cardId: "h1", position: 1 } });
  });

  it("encodes the run id in the URL", async () => {
    let id: unknown;
    server.use(
      http.post(`${BASE}/api/runs/:id/plays`, ({ params }) => {
        id = params["id"];
        return HttpResponse.json(playResponse);
      }),
    );

    await api.playCard("a/b c", { cardId: "h1", position: 0 });

    expect(id).toBe("a/b c");
  });

  it("maps an API error to ApiError with its code, message and status", async () => {
    server.use(
      http.post(`${BASE}/api/runs/:id/plays`, () =>
        HttpResponse.json({ code: "CARD_NOT_IN_HAND", message: "Card x is not in the hand" }, { status: 422 }),
      ),
    );

    const error = await caught(api.playCard("run-1", { cardId: "x", position: 0 }));

    expect(error).toMatchObject({ code: "CARD_NOT_IN_HAND", message: "Card x is not in the hand", status: 422 });
  });

  it("copes with a non-JSON error body", async () => {
    server.use(http.post(`${BASE}/api/runs/:id/plays`, () => new HttpResponse("<html>boom</html>", { status: 502 })));

    const error = await caught(api.playCard("run-1", { cardId: "h1", position: 0 }));

    expect(error).toMatchObject({ code: "UNEXPECTED_RESPONSE", status: 502 });
  });
});
