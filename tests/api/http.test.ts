import { afterEach, describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/app/api/http";
import { RunNotFoundError } from "@/features/runs/application/errors";

afterEach(() => vi.restoreAllMocks());

describe("errorResponse", () => {
  it("logs an unexpected error with its cause but only sends a generic message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("database exploded", { cause: new Error("password authentication failed") });

    const response = errorResponse(failure);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: "INTERNAL_ERROR", message: "Unexpected error" });
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]).toContain(failure);
    expect(log.mock.calls[0]).toContain(failure.cause);
  });

  it("does not log expected business errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = errorResponse(new RunNotFoundError("r1"));

    expect(response.status).toBe(404);
    expect(log).not.toHaveBeenCalled();
  });
});
