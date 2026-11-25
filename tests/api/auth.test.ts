import { beforeEach, describe, expect, it } from "vitest";
import { DELETE as logOut } from "@/app/api/sessions/current/route";
import { POST as logIn } from "@/app/api/sessions/route";
import { POST as signUp } from "@/app/api/users/route";
import { readSessionToken, SESSION_COOKIE } from "@/app/api/session-cookie";
import { container } from "@/app/container";
import { currentUser } from "@/features/auth/application/current-user";
import type { SessionResponse } from "@/features/auth/presentation/schemas";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";

const credentials = { email: "Ada@Example.org", password: "correct horse" };

const post = (handler: (request: Request) => Promise<Response>, body: unknown) =>
  handler(
    new Request("http://test.local", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

/** Jeton posé par la réponse, tel que le navigateur le renverra. */
const tokenOf = (response: Response) => readSessionToken(response.headers.get("set-cookie")?.split(";")[0] ?? null);

beforeEach(resetDatabase);

describe("POST /api/users", () => {
  it("creates the account, logs the player in and never returns the password hash", async () => {
    const response = await post(signUp, credentials);

    expect(response.status).toBe(201);
    const body = (await response.json()) as SessionResponse;
    expect(body).toEqual({ user: { id: expect.any(String), email: "ada@example.org" } });
    expect(JSON.stringify(body)).not.toContain("scrypt");

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(new RegExp(`^${SESSION_COOKIE}=[\\w-]{43}; Expires=`));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect((await currentUser(container.auth, tokenOf(response)))?.email).toBe("ada@example.org");
  });

  it("stores a scrypt hash, not the password", async () => {
    await post(signUp, credentials);

    const row = await db.orm.public.User.first({ email: "ada@example.org" });
    expect(row?.passwordHash).toMatch(/^scrypt\$/);
    expect(row?.passwordHash).not.toContain(credentials.password);
  });

  it("refuses an email already used with 409 EMAIL_ALREADY_USED", async () => {
    await post(signUp, credentials);

    const response = await post(signUp, { ...credentials, email: "ada@example.ORG" });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "EMAIL_ALREADY_USED" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each([
    [{ ...credentials, email: "nope" }, "INVALID_EMAIL"],
    [{ ...credentials, password: "short" }, "WEAK_PASSWORD"],
  ])("refuses %o with 422", async (body, code) => {
    const response = await post(signUp, body);

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code });
  });

  it.each([["not json"], [{ email: "ada@example.org" }], [{ ...credentials, admin: true }]])(
    "refuses a malformed body %o with 400 INVALID_REQUEST",
    async (body) => {
      const response = await post(signUp, body);

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
    },
  );
});

describe("POST /api/sessions", () => {
  beforeEach(() => post(signUp, credentials));

  it("logs the player in with a new session cookie", async () => {
    const response = await post(logIn, { email: "ada@example.org", password: credentials.password });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ user: { email: "ada@example.org" } });
    expect((await currentUser(container.auth, tokenOf(response)))?.email).toBe("ada@example.org");
  });

  it.each([
    { email: credentials.email, password: "wrong password" },
    { email: "grace@example.org", password: credentials.password },
  ])("refuses %o with the same 401 INVALID_CREDENTIALS", async (body) => {
    const response = await post(logIn, body);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("DELETE /api/sessions/current", () => {
  const logOutWith = (cookie?: string) =>
    logOut(new Request("http://test.local", { method: "DELETE", headers: cookie ? { cookie } : {} }));

  it("closes the session and clears the cookie", async () => {
    const token = tokenOf(await post(signUp, credentials));

    const response = await logOutWith(`${SESSION_COOKIE}=${token}`);

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(new RegExp(`^${SESSION_COOKIE}=; Max-Age=0`));
    expect(await currentUser(container.auth, token)).toBeNull();
  });

  it("succeeds without a session too", async () => {
    expect((await logOutWith()).status).toBe(204);
    expect((await logOutWith(`${SESSION_COOKIE}=unknown`)).status).toBe(204);
  });
});
