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
  type GameAction,
  type GameState,
} from "./game-state";
import type { PlayResponse, RunResponse } from "./schemas";

const baseRun: RunResponse = {
  id: "run-1",
  status: "in_progress",
  timeline: [{ id: "t1", title: "Start", year: 1000 }],
  hand: [
    { id: "h1", title: "Alpha" },
    { id: "h2", title: "Beta" },
  ],
  drawPileCount: 5,
  discard: [],
};

const correct: PlayResponse = {
  outcome: "correct",
  card: { id: "h1", title: "Alpha", year: 1100 },
  run: { ...baseRun, timeline: [...baseRun.timeline, { id: "h1", title: "Alpha", year: 1100 }], hand: [{ id: "h2", title: "Beta" }] },
};

const incorrect: PlayResponse = {
  outcome: "incorrect",
  card: { id: "h1", title: "Alpha", year: 1500 },
  drawnCard: { id: "d1", title: "Gamma" },
  run: { ...baseRun, hand: [{ id: "h2", title: "Beta" }, { id: "d1", title: "Gamma" }], drawPileCount: 4, discard: [{ id: "h1", title: "Alpha", year: 1500 }] },
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
