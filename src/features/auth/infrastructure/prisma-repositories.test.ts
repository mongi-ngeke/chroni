import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";
import { Session } from "../domain/session";
import { User } from "../domain/user";
import { PrismaSessionRepository } from "./prisma-session-repository";
import { PrismaUserRepository } from "./prisma-user-repository";

const users = new PrismaUserRepository(db);
const sessions = new PrismaSessionRepository(db);
const ada = User.create({ id: "u1", email: "ada@example.org", passwordHash: "scrypt$hash" });

beforeEach(resetDatabase);

describe("PrismaUserRepository", () => {
  it("finds a created user by email and by id", async () => {
    await users.create(ada);

    expect(await users.findByEmail("ada@example.org")).toEqual(ada);
    expect(await users.findById("u1")).toEqual(ada);
  });

  it("returns null for an unknown user", async () => {
    expect(await users.findByEmail("grace@example.org")).toBeNull();
    expect(await users.findById("nope")).toBeNull();
  });

  it("refuses a second account with the same email (unique constraint)", async () => {
    await users.create(ada);

    await expect(
      users.create(User.create({ id: "u2", email: "ada@example.org", passwordHash: "scrypt$other" })),
    ).rejects.toThrow();
  });
});

describe("PrismaSessionRepository", () => {
  const session = Session.restore({ id: "digest-1", userId: "u1", expiresAt: new Date("2026-02-01T10:00:00.123Z") });

  beforeEach(() => users.create(ada));

  it("round-trips a session, keeping its expiry to the millisecond", async () => {
    await sessions.create(session);

    expect(await sessions.findById("digest-1")).toEqual(session);
  });

  it("deletes a session, and ignores a session already deleted", async () => {
    await sessions.create(session);

    await sessions.delete("digest-1");
    await sessions.delete("digest-1");

    expect(await sessions.findById("digest-1")).toBeNull();
  });

  it("deletes the sessions of a deleted account (cascade)", async () => {
    await sessions.create(session);

    await db.orm.public.User.where({ id: "u1" }).deleteAll();

    expect(await sessions.findById("digest-1")).toBeNull();
  });
});
