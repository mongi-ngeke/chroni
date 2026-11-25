import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { server } from "@tests/msw/server";
import { ApiError, callApi } from "./api-call";

const BASE = "http://api.test";

describe("callApi", () => {
  it("returns undefined for a response without body when no schema is expected", async () => {
    server.use(http.delete(`${BASE}/thing`, () => new HttpResponse(null, { status: 204 })));

    await expect(callApi(`${BASE}/thing`, { method: "DELETE" }, null)).resolves.toBeUndefined();
  });

  it("validates the body against the schema", async () => {
    server.use(http.get(`${BASE}/thing`, () => HttpResponse.json({ name: "Ada" })));

    await expect(callApi(`${BASE}/thing`, {}, z.strictObject({ name: z.string() }))).resolves.toEqual({ name: "Ada" });
    await expect(callApi(`${BASE}/thing`, {}, z.strictObject({ id: z.string() }))).rejects.toMatchObject({
      code: "UNEXPECTED_RESPONSE",
    });
  });

  it("turns an API error body into an ApiError with its business code and status", async () => {
    server.use(http.get(`${BASE}/thing`, () => HttpResponse.json({ code: "NOPE", message: "No" }, { status: 409 })));

    const error = await callApi(`${BASE}/thing`, {}, null).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "NOPE", status: 409 });
  });

  it("reports a transport failure as NETWORK_ERROR", async () => {
    server.use(http.get(`${BASE}/thing`, () => HttpResponse.error()));

    await expect(callApi(`${BASE}/thing`, {}, null)).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
