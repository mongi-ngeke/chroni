import { describe, expect, it, vi } from "vitest";
import { ApiError, type RunsApi } from "./api-client";
import {
  canPlay,
  describeFeedback,
  errorMessage,
  formatYear,
  gameReducer,
  initialGameState,
  playSelectedCard,
  poolMessage,
  cardCount,
  fanPosition,
  type GameAction,
  type GameState,
} from "./game-state";
import type { PlayResponse, RunResponse } from "./schemas";
import { hidden, revealed } from "@tests/support/dto";

const baseRun: RunResponse = {
  id: "run-1",
  status: "in_progress",
  timeline: [revealed("t1", "Start", 1000)],
  hand: [
    hidden("h1", "Alpha"),
    hidden("h2", "Beta"),
  ],
  drawPileCount: 5,
  discard: [],
};

const correct: PlayResponse = {
  outcome: "correct",
  card: revealed("h1", "Alpha", 1100),
  run: { ...baseRun, timeline: [...baseRun.timeline, revealed("h1", "Alpha", 1100)], hand: [hidden("h2", "Beta")] },
};

const incorrect: PlayResponse = {
  outcome: "incorrect",
  card: revealed("h1", "Alpha", 1500),
  drawnCard: hidden("d1", "Gamma"),
  run: { ...baseRun, hand: [hidden("h2", "Beta"), hidden("d1", "Gamma")], drawPileCount: 4, discard: [revealed("h1", "Alpha", 1500)] },
};

const start = (): GameState => initialGameState(baseRun);
const reduce = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);

describe("selection", () => {
  it("selects a card from the hand", () => {
    expect(reduce(start(), { type: "select", cardId: "h1" }).selectedCardId).toBe("h1");
  });

  it("deselects when the same card is clicked again", () => {
    expect(reduce(start(), { type: "select", cardId: "h1" }, { type: "select", cardId: "h1" }).selectedCardId).toBeNull();
  });

  it("switches to another card", () => {
    expect(reduce(start(), { type: "select", cardId: "h1" }, { type: "select", cardId: "h2" }).selectedCardId).toBe("h2");
  });

  it("ignores a card that is not in the hand", () => {
    expect(reduce(start(), { type: "select", cardId: "t1" }).selectedCardId).toBeNull();
  });

  it("ignores selection while a play is pending or once the run is won", () => {
    const pending = reduce(start(), { type: "select", cardId: "h1" }, { type: "playStarted" }, { type: "select", cardId: "h2" });
    expect(pending.selectedCardId).toBe("h1");

    const won = initialGameState({ ...baseRun, status: "won", hand: [] });
    expect(reduce(won, { type: "select", cardId: "h1" }).selectedCardId).toBeNull();
  });
});

describe("applying a play result", () => {
  it("replaces the run, clears the selection and records a correct feedback", () => {
    const state = reduce(start(), { type: "select", cardId: "h1" }, { type: "playStarted" }, { type: "playSucceeded", result: correct });

    expect(state.run).toBe(correct.run);
    expect(state.selectedCardId).toBeNull();
    expect(state.pending).toBe(false);
    expect(state.feedback).toEqual({ outcome: "correct", card: correct.card });
  });

  it("records the revealed card and the drawn card after a mistake", () => {
    const state = reduce(start(), { type: "playSucceeded", result: incorrect });

    expect(state.feedback).toEqual({ outcome: "incorrect", card: incorrect.card, drawnCard: incorrect.drawnCard });
  });

  it("clears a previous error and feedback when a new play starts", () => {
    const failed = reduce(start(), { type: "playFailed", error: new ApiError("NETWORK_ERROR", "x") });
    expect(failed.error).not.toBeNull();

    const next = reduce(failed, { type: "playStarted" });
    expect(next.error).toBeNull();
    expect(next.pending).toBe(true);
  });

  it("can dismiss the feedback", () => {
    const state = reduce(start(), { type: "playSucceeded", result: correct }, { type: "dismissFeedback" });

    expect(state.feedback).toBeNull();
  });
});

describe("failures", () => {
  it("keeps the run and shows a French message for an API error", () => {
    const state = reduce(
      start(),
      { type: "select", cardId: "h1" },
      { type: "playStarted" },
      { type: "playFailed", error: new ApiError("CARD_NOT_IN_HAND", "x", 422) },
    );

    expect(state.run).toBe(baseRun);
    expect(state.pending).toBe(false);
    expect(state.error).toBe(errorMessage("CARD_NOT_IN_HAND"));
  });

  it("falls back to a generic message for an unknown error", () => {
    const state = reduce(start(), { type: "playFailed", error: new Error("boom") });

    expect(state.error).toBe(errorMessage("UNKNOWN"));
  });

  it.each(["RUN_NOT_FOUND", "CARD_NOT_IN_HAND", "INVALID_POSITION", "RUN_ALREADY_WON", "NETWORK_ERROR", "UNEXPECTED_RESPONSE", "INVALID_REQUEST", "UNKNOWN"])(
    "has a French message for %s",
    (code) => {
      expect(errorMessage(code)).toMatch(/\S/);
    },
  );
});

describe("canPlay", () => {
  it("requires a selected card, no pending play and a run in progress", () => {
    expect(canPlay(start())).toBe(false);
    const selected = reduce(start(), { type: "select", cardId: "h1" });
    expect(canPlay(selected)).toBe(true);
    expect(canPlay(reduce(selected, { type: "playStarted" }))).toBe(false);
  });
});

describe("playSelectedCard", () => {
  const fakeApi = (playCard: RunsApi["playCard"]): RunsApi => ({ startRun: vi.fn(), playCard });

  it("sends the selected card at the chosen position and dispatches the result", async () => {
    const playCard = vi.fn().mockResolvedValue(correct);
    const dispatch = vi.fn();
    const state = reduce(start(), { type: "select", cardId: "h1" });

    await playSelectedCard(fakeApi(playCard), state, 1, dispatch);

    expect(playCard).toHaveBeenCalledWith("run-1", { cardId: "h1", position: 1 });
    expect(dispatch.mock.calls.map(([action]) => (action as GameAction).type)).toEqual(["playStarted", "playSucceeded"]);
  });

  it("dispatches playFailed when the call fails", async () => {
    const error = new ApiError("NETWORK_ERROR", "down");
    const dispatch = vi.fn();
    const state = reduce(start(), { type: "select", cardId: "h1" });

    await playSelectedCard(fakeApi(vi.fn().mockRejectedValue(error)), state, 0, dispatch);

    expect(dispatch).toHaveBeenLastCalledWith({ type: "playFailed", error });
  });

  it("does nothing without a selection or while a play is pending", async () => {
    const playCard = vi.fn();
    const dispatch = vi.fn();
    const pending = reduce(start(), { type: "select", cardId: "h1" }, { type: "playStarted" });

    await playSelectedCard(fakeApi(playCard), start(), 0, dispatch);
    await playSelectedCard(fakeApi(playCard), pending, 0, dispatch);

    expect(playCard).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("formatYear", () => {
  it.each([
    [1789, "1789"],
    [79, "79"],
    [-490, "490 av. J.-C."],
    [-44, "44 av. J.-C."],
  ])("formats %i as %s", (year, expected) => {
    expect(formatYear(year)).toBe(expected);
  });
});

describe("describeFeedback", () => {
  it("congratulates and reveals the date after a correct placement", () => {
    const text = describeFeedback({ outcome: "correct", card: correct.card });

    expect(text).toContain("Bien joué");
    expect(text).toContain("Alpha");
    expect(text).toContain("1100");
  });

  it("reveals the real date after a mistake and mentions the new card", () => {
    const text = describeFeedback({ outcome: "incorrect", card: incorrect.card, drawnCard: incorrect.drawnCard });

    expect(text).toContain("Raté");
    expect(text).toContain("1500");
    expect(text).toContain("piochez");
  });

  it("says the draw pile is empty when no card is drawn", () => {
    const text = describeFeedback({ outcome: "incorrect", card: incorrect.card });

    expect(text).toContain("Raté");
    expect(text).toContain("pioche est épuisée");
  });
});

describe("poolMessage", () => {
  it("announces the last cards when the draw pile is empty", () => {
    expect(poolMessage({ ...baseRun, drawPileCount: 0 })).toContain("épuisée");
  });

  it("shows the number of cards left in the draw pile otherwise", () => {
    expect(poolMessage({ ...baseRun, drawPileCount: 5 })).toContain("5");
    expect(poolMessage({ ...baseRun, drawPileCount: 1 })).toContain("1 carte");
  });

  it("is empty once the run is won", () => {
    expect(poolMessage({ ...baseRun, status: "won", hand: [] })).toBe("");
  });
});

describe("cardCount", () => {
  it("uses the French plural from two cards on", () => {
    expect(cardCount(0)).toBe("0 carte");
    expect(cardCount(1)).toBe("1 carte");
    expect(cardCount(2)).toBe("2 cartes");
  });
});

describe("fanPosition", () => {
  it("leaves a single card straight", () => {
    expect(fanPosition(0, 1)).toEqual({ angle: 0, drop: 0 });
  });

  it("is symmetric around the centre of the hand", () => {
    for (let index = 0; index < 10; index++) {
      const mirrored = fanPosition(9 - index, 10);
      expect(fanPosition(index, 10).angle).toBeCloseTo(-mirrored.angle);
      expect(fanPosition(index, 10).drop).toBeCloseTo(mirrored.drop);
    }
  });

  it("tilts left cards to the left and right cards to the right", () => {
    expect(fanPosition(0, 3).angle).toBeLessThan(0);
    expect(fanPosition(1, 3)).toEqual({ angle: 0, drop: 0 });
    expect(fanPosition(2, 3).angle).toBeGreaterThan(0);
  });

  it("drops the cards more towards the edges, to draw an arc", () => {
    expect(fanPosition(0, 10).drop).toBeGreaterThan(fanPosition(3, 10).drop);
    expect(fanPosition(3, 10).drop).toBeGreaterThan(fanPosition(4, 10).drop);
  });

  it("keeps the whole fan within its maximal spread, however many cards", () => {
    for (const count of [2, 5, 10, 20]) {
      const spread = fanPosition(count - 1, count).angle - fanPosition(0, count).angle;
      expect(spread).toBeLessThanOrEqual(36);
    }
    // Peu de cartes : l'écart entre voisines est plafonné, l'éventail reste serré.
    expect(fanPosition(1, 2).angle - fanPosition(0, 2).angle).toBe(4);
  });
});
