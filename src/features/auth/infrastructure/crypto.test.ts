import { describe, expect, it } from "vitest";
import { CryptoSessionTokens } from "./crypto-session-tokens";
import { ScryptPasswordHasher } from "./scrypt-password-hasher";
import { SystemClock } from "./system-clock";

describe("ScryptPasswordHasher", () => {
  const hasher = new ScryptPasswordHasher();

  it("verifies the right password and refuses a wrong one", async () => {
    const hash = await hasher.hash("correct horse");

    expect(await hasher.verify("correct horse", hash)).toBe(true);
    expect(await hasher.verify("correct horsE", hash)).toBe(false);
  });

  it("never stores the password, and salts every hash", async () => {
    const first = await hasher.hash("correct horse");
    const second = await hasher.hash("correct horse");

    expect(first).not.toContain("correct horse");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/);
  });

  it("verifies a hash made with other parameters, read from the hash itself", async () => {
    const hash = await new ScryptPasswordHasher({ N: 2 ** 10, r: 8, p: 1 }).hash("correct horse");

    expect(await hasher.verify("correct horse", hash)).toBe(true);
  });

  it.each(["", "plain-text", "scrypt$x$8$1$c2FsdA$a2V5", "bcrypt$1$2$3$4$5", "scrypt$1024$8$1$$"])(
    "refuses a malformed hash %j without throwing",
    async (hash) => {
      expect(await hasher.verify("correct horse", hash)).toBe(false);
    },
  );
});

describe("CryptoSessionTokens", () => {
  const tokens = new CryptoSessionTokens();

  it("generates long, distinct, URL-safe tokens", () => {
    const generated = new Set(Array.from({ length: 50 }, () => tokens.generate()));

    expect(generated.size).toBe(50);
    for (const token of generated) {
      expect(token).toMatch(/^[\w-]{43}$/);
    }
  });

  it("digests a token into a stable SHA-256 that does not contain it", () => {
    const token = tokens.generate();

    expect(tokens.digest(token)).toBe(tokens.digest(token));
    expect(tokens.digest(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(tokens.digest(token)).not.toContain(token);
    expect(tokens.digest(token)).not.toBe(tokens.digest(tokens.generate()));
  });
});

describe("SystemClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
