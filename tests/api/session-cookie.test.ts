import { describe, expect, it } from "vitest";
import { clearedSessionCookie, readSessionToken, SESSION_COOKIE, sessionCookie } from "@/app/api/session-cookie";

describe("sessionCookie", () => {
  const expiresAt = new Date("2026-02-01T10:00:00Z");

  it("holds the token, hidden from scripts and from other sites, until the session expires", () => {
    expect(sessionCookie("abc", expiresAt, { secure: false })).toBe(
      `${SESSION_COOKIE}=abc; Expires=Sun, 01 Feb 2026 10:00:00 GMT; Path=/; HttpOnly; SameSite=Lax`,
    );
  });

  it("is restricted to HTTPS when secure", () => {
    expect(sessionCookie("abc", expiresAt, { secure: true })).toMatch(/; Secure$/);
    expect(clearedSessionCookie({ secure: true })).toMatch(/; Secure$/);
  });

  it("is cleared with an empty value that expires at once", () => {
    expect(clearedSessionCookie({ secure: false })).toBe(`${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  });
});

describe("readSessionToken", () => {
  it("finds the token among other cookies", () => {
    expect(readSessionToken(`theme=dark; ${SESSION_COOKIE}=abc-123_x; lang=fr`)).toBe("abc-123_x");
  });

  it("returns undefined without a header, without the cookie or with an empty value", () => {
    expect(readSessionToken(null)).toBeUndefined();
    expect(readSessionToken("theme=dark")).toBeUndefined();
    expect(readSessionToken(`${SESSION_COOKIE}=`)).toBeUndefined();
  });

  it("does not mistake a cookie whose name merely contains the session cookie name", () => {
    expect(readSessionToken(`old_${SESSION_COOKIE}=abc`)).toBeUndefined();
  });
});
