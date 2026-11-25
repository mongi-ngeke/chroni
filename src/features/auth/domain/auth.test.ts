import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email";
import { InvalidEmailError, WeakPasswordError } from "./errors";
import { assertAcceptablePassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password";
import { Session, SESSION_DURATION_MS } from "./session";
import { User } from "./user";

describe("normalizeEmail", () => {
  it("trims and lowercases the address, so case does not create a second account", () => {
    expect(normalizeEmail("  Ada.Lovelace@Example.ORG ")).toBe("ada.lovelace@example.org");
  });

  it.each(["", "ada", "ada@", "@example.org", "ada@example", "ada lovelace@example.org", "ada@@example.org"])(
    "refuses %j",
    (raw) => {
      expect(() => normalizeEmail(raw)).toThrow(InvalidEmailError);
    },
  );

  it("refuses an address longer than 254 characters", () => {
    expect(() => normalizeEmail(`${"a".repeat(250)}@example.org`)).toThrow(InvalidEmailError);
  });

  it("exposes a stable code", () => {
    expect(new InvalidEmailError().code).toBe("INVALID_EMAIL");
  });
});

describe("assertAcceptablePassword", () => {
  it("accepts a password at both length limits", () => {
    expect(() => assertAcceptablePassword("a".repeat(PASSWORD_MIN_LENGTH))).not.toThrow();
    expect(() => assertAcceptablePassword("a".repeat(PASSWORD_MAX_LENGTH))).not.toThrow();
  });

  it("refuses a password that is too short or too long", () => {
    expect(() => assertAcceptablePassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toThrow(WeakPasswordError);
    expect(() => assertAcceptablePassword("a".repeat(PASSWORD_MAX_LENGTH + 1))).toThrow(WeakPasswordError);
  });

  it("counts characters, not UTF-16 units, and never trims spaces", () => {
    expect(() => assertAcceptablePassword("🔒".repeat(PASSWORD_MIN_LENGTH))).not.toThrow();
    expect(() => assertAcceptablePassword("   ab   ")).not.toThrow();
  });

  it("exposes a stable code", () => {
    expect(new WeakPasswordError(8, 128).code).toBe("WEAK_PASSWORD");
  });
});

describe("User", () => {
  it("stores the normalized email", () => {
    const user = User.create({ id: "u1", email: " Ada@Example.org", passwordHash: "hash" });

    expect(user.email).toBe("ada@example.org");
    expect(user.passwordHash).toBe("hash");
  });

  it("refuses an invalid email", () => {
    expect(() => User.create({ id: "u1", email: "not-an-email", passwordHash: "hash" })).toThrow(InvalidEmailError);
  });
});

describe("Session", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("expires SESSION_DURATION_MS after it is opened", () => {
    const session = Session.open({ id: "s1", userId: "u1", now });

    expect(session.expiresAt.getTime() - now.getTime()).toBe(SESSION_DURATION_MS);
  });

  it("is valid until its expiry, and expired from that exact instant", () => {
    const session = Session.open({ id: "s1", userId: "u1", now });

    expect(session.isExpiredAt(new Date(session.expiresAt.getTime() - 1))).toBe(false);
    expect(session.isExpiredAt(session.expiresAt)).toBe(true);
  });
});
