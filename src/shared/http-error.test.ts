import { describe, expect, it } from "vitest";
import { DomainError } from "./domain-error";
import { toHttpError } from "./http-error";

class SampleError extends DomainError {
  readonly code = "SAMPLE";
}

describe("toHttpError", () => {
  it("uses the status of a known business code", () => {
    expect(toHttpError(new SampleError("Nope"), { SAMPLE: 409 })).toEqual({
      status: 409,
      body: { code: "SAMPLE", message: "Nope" },
    });
  });

  it("treats an unknown business code as a server failure, keeping its code", () => {
    expect(toHttpError(new SampleError("Nope"), {})).toEqual({ status: 500, body: { code: "SAMPLE", message: "Nope" } });
  });

  it("hides the details of an unexpected error", () => {
    expect(toHttpError(new Error("password=secret"), { SAMPLE: 409 })).toEqual({
      status: 500,
      body: { code: "INTERNAL_ERROR", message: "Unexpected error" },
    });
  });

  it("names a business error after its class", () => {
    expect(new SampleError("Nope").name).toBe("SampleError");
  });
});
