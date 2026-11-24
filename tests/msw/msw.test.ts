import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./server";

describe("MSW test server", () => {
  it("intercepts a declared request", async () => {
    server.use(http.get("https://example.test/ping", () => HttpResponse.json({ ok: true })));

    const response = await fetch("https://example.test/ping");

    expect(await response.json()).toEqual({ ok: true });
  });

  it("fails on an unhandled request", async () => {
    await expect(fetch("https://example.test/unknown")).rejects.toThrow();
  });
});
