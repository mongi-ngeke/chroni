import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";
import { PrismaCardRepository } from "./prisma-card-repository";

const repository = new PrismaCardRepository(db);

beforeEach(async () => {
  await resetDatabase();
  await db.orm.public.Card.create({ id: "c1", title: "Bastille", year: 1789, category: "historical" });
  await db.orm.public.Card.create({ id: "c2", title: "Marathon", year: -490 });
  await db.orm.public.Card.create({ id: "c3", title: "Moon landing", year: 1969 });
});

describe("PrismaCardRepository", () => {
  it("maps every row to a domain Card", async () => {
    const cards = await repository.findAll();

    expect(cards).toHaveLength(3);
    const bastille = cards.find((card) => card.id === "c1");
    expect(bastille).toMatchObject({ title: "Bastille", year: 1789, category: "historical" });
    expect(cards.find((card) => card.id === "c2")?.category).toBeUndefined();
  });

  it("finds cards by ids and ignores unknown ids", async () => {
    const cards = await repository.findByIds(["c2", "c3", "missing"]);

    expect(cards.map((card) => card.id).sort()).toEqual(["c2", "c3"]);
  });

  it("returns nothing for an empty id list", async () => {
    expect(await repository.findByIds([])).toEqual([]);
  });
});
