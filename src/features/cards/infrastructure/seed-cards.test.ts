import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/prisma/db";
import { resetDatabase } from "@tests/support/database";
import { seedCardsInto } from "./seed-cards";

beforeEach(resetDatabase);

describe("seedCardsInto", () => {
  it("stores the 100 cards and can be replayed without duplicates", async () => {
    expect(await seedCardsInto(db)).toBe(100);
    await seedCardsInto(db);

    expect(await db.orm.public.Card.all()).toHaveLength(100);
  });

  it("stores the description and the image of each card", async () => {
    await seedCardsInto(db);

    const rows = await db.orm.public.Card.all();

    expect(rows).toHaveLength(100);
    for (const row of rows) {
      expect(row.description, row.title).not.toBe("");
      expect(row.imageUrl, row.title).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(row.imageAlt, row.title).not.toBe("");
      expect(row.imageCredit, row.title).toMatch(/Wikimedia Commons$/);
    }
  });

  it("updates an existing card instead of duplicating it", async () => {
    await seedCardsInto(db);
    await db.orm.public.Card.where({ id: "prise-de-la-bastille" }).update({ year: 1 });

    await seedCardsInto(db);

    expect((await db.orm.public.Card.first({ id: "prise-de-la-bastille" }))?.year).toBe(1789);
  });
});
