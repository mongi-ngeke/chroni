import { describe, expect, it } from "vitest";
import { RunNotFoundError } from "../application/errors";
import { CardNotInHandError, InvalidPositionError, NotEnoughCardsError, RunAlreadyWonError } from "../domain/errors";
import { toHttpError } from "./error-mapper";

describe("toHttpError", () => {
  it.each([
    [new RunNotFoundError("r"), 404, "RUN_NOT_FOUND"],
    [new CardNotInHandError("c"), 422, "CARD_NOT_IN_HAND"],
    [new InvalidPositionError(9, 1), 422, "INVALID_POSITION"],
    [new RunAlreadyWonError(), 409, "RUN_ALREADY_WON"],
    [new NotEnoughCardsError(11, 3), 500, "NOT_ENOUGH_CARDS"],
  ])("maps %o", (error, status, code) => {
    const { status: actual, body } = toHttpError(error);

    expect(actual).toBe(status);
    expect(body.code).toBe(code);
    expect(body.message).toEqual(expect.any(String));
  });

  it("hides the details of an unexpected error", () => {
    const { status, body } = toHttpError(new Error("password=secret"));

    expect(status).toBe(500);
    expect(body).toEqual({ code: "INTERNAL_ERROR", message: "Unexpected error" });
  });
});
