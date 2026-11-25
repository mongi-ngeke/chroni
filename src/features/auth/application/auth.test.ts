import { describe, expect, it } from "vitest";
import { InvalidEmailError, WeakPasswordError } from "../domain/errors";
import { SESSION_DURATION_MS } from "../domain/session";
import { currentUser } from "./current-user";
import { EmailAlreadyUsedError, InvalidCredentialsError } from "./errors";
import { logIn } from "./log-in";
import { logOut } from "./log-out";
import { signUp } from "./sign-up";
import { inMemoryAuth } from "./testing/in-memory";

const credentials = { email: "Ada@Example.org", password: "correct horse" };

describe("signUp", () => {
  it("creates the account with a normalized email and a hashed password, then opens a session", async () => {
    const deps = inMemoryAuth();

    const opened = await signUp(deps, credentials);

    expect(opened.user.email).toBe("ada@example.org");
    expect(opened.user.passwordHash).toBe("hashed:correct horse");
    expect(deps.users.saved.get(opened.user.id)).toBe(opened.user);
    expect(opened.token).toBe("token-1");
    // Seule l'empreinte du jeton est enregistrée.
    expect([...deps.sessions.saved.keys()]).toEqual(["digest:token-1"]);
    expect(opened.expiresAt.getTime() - deps.clock.now().getTime()).toBe(SESSION_DURATION_MS);
  });

  it("refuses an email already used, whatever its case", async () => {
    const deps = inMemoryAuth();
    await signUp(deps, credentials);

    await expect(signUp(deps, { ...credentials, email: " ADA@example.ORG" })).rejects.toThrow(EmailAlreadyUsedError);
    expect(deps.users.saved.size).toBe(1);
  });

  it("refuses an invalid email or a weak password without creating anything", async () => {
    const deps = inMemoryAuth();

    await expect(signUp(deps, { ...credentials, email: "nope" })).rejects.toThrow(InvalidEmailError);
    await expect(signUp(deps, { ...credentials, password: "short" })).rejects.toThrow(WeakPasswordError);
    expect(deps.users.saved.size).toBe(0);
    expect(deps.sessions.saved.size).toBe(0);
  });
});

describe("logIn", () => {
  it("opens a new session with the right password, whatever the email case", async () => {
    const deps = inMemoryAuth();
    const { user } = await signUp(deps, credentials);

    const opened = await logIn(deps, { email: "ADA@example.org ", password: "correct horse" });

    expect(opened.user.id).toBe(user.id);
    expect(opened.token).toBe("token-2");
    expect(deps.sessions.saved.has("digest:token-2")).toBe(true);
  });

  it("gives the same error for a wrong password, an unknown email and an invalid email", async () => {
    const deps = inMemoryAuth();
    await signUp(deps, credentials);

    for (const attempt of [
      { email: credentials.email, password: "wrong password" },
      { email: "grace@example.org", password: "correct horse" },
      { email: "not-an-email", password: "correct horse" },
    ]) {
      await expect(logIn(deps, attempt)).rejects.toThrow(InvalidCredentialsError);
    }
    expect(deps.sessions.saved.size).toBe(1);
  });

  it("still hashes the password for an unknown email, so timing does not reveal accounts", async () => {
    const deps = inMemoryAuth();

    await expect(logIn(deps, { email: "grace@example.org", password: "whatever1" })).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(deps.passwords.hashCalls).toBe(1);
  });

  it("refuses an oversized password without hashing it", async () => {
    const deps = inMemoryAuth();

    await expect(logIn(deps, { email: credentials.email, password: "a".repeat(10_000) })).rejects.toThrow(
      InvalidCredentialsError,
    );
    expect(deps.passwords.hashCalls).toBe(0);
  });
});

describe("currentUser", () => {
  it("returns the player of a valid session", async () => {
    const deps = inMemoryAuth();
    const { user, token } = await signUp(deps, credentials);

    expect(await currentUser(deps, token)).toBe(user);
  });

  it("returns null without a token or with an unknown token", async () => {
    const deps = inMemoryAuth();
    await signUp(deps, credentials);

    expect(await currentUser(deps, undefined)).toBeNull();
    expect(await currentUser(deps, "")).toBeNull();
    expect(await currentUser(deps, "forged-token")).toBeNull();
  });

  it("returns null and deletes the session once it has expired", async () => {
    const deps = inMemoryAuth();
    const { token, expiresAt } = await signUp(deps, credentials);
    deps.clock.current = expiresAt;

    expect(await currentUser(deps, token)).toBeNull();
    expect(deps.sessions.saved.size).toBe(0);
  });

  it("returns null when the account no longer exists", async () => {
    const deps = inMemoryAuth();
    const { user, token } = await signUp(deps, credentials);
    deps.users.saved.delete(user.id);

    expect(await currentUser(deps, token)).toBeNull();
  });
});

describe("logOut", () => {
  it("closes the session of the token, leaving the others open", async () => {
    const deps = inMemoryAuth();
    const first = await signUp(deps, credentials);
    const second = await logIn(deps, credentials);

    await logOut(deps, first.token);

    expect(await currentUser(deps, first.token)).toBeNull();
    expect(await currentUser(deps, second.token)).not.toBeNull();
  });

  it("does nothing without a token or for a session already closed", async () => {
    const deps = inMemoryAuth();
    const { token } = await signUp(deps, credentials);

    await logOut(deps, undefined);
    await logOut(deps, token);
    await logOut(deps, token);

    expect(deps.sessions.saved.size).toBe(0);
  });
});

describe("auth error codes", () => {
  it("are stable", () => {
    expect(new EmailAlreadyUsedError().code).toBe("EMAIL_ALREADY_USED");
    expect(new InvalidCredentialsError().code).toBe("INVALID_CREDENTIALS");
  });
});
