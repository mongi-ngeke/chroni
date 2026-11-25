import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/prisma/db";
import { insertCard, resetDatabase } from "@tests/support/database";
import { InvalidCardError } from "../domain/card";
import { PrismaCardRepository } from "./prisma-card-repository";

const repository = new PrismaCardRepository(db);

beforeEach(async () => {
  await resetDatabase();
  await insertCard({ id: "c1", title: "Bastille", year: 1789, category: "historical", description: "Une forteresse est prise." });
  await insertCard({ id: "c2", title: "Marathon", year: -490 });
  await insertCard({ id: "c3", title: "Moon landing", year: 1969 });
});

describe("PrismaCardRepository", () => {
  it("maps every row to a domain Card", async () => {
    const cards = await repository.findAll();

    expect(cards).toHaveLength(3);
    const bastille = cards.find((card) => card.id === "c1");
    expect(bastille).toMatchObject({ title: "Bastille", year: 1789, category: "historical" });
    expect(cards.find((card) => card.id === "c2")?.category).toBeUndefined();
  });

  it("round-trips the description and the image", async () => {
    const [bastille] = await repository.findByIds(["c1"]);

    expect(bastille?.description).toBe("Une forteresse est prise.");
    expect(bastille?.image).toEqual({
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/960px-Example.jpg",
      alt: "Image de test",
      credit: "Auteur de test — CC0, via Wikimedia Commons",
    });
  });

  // Entre la migration (colonnes vides) et le seed, mieux vaut un échec visible qu'une carte sans contenu.
  it("refuses to load a card whose content is blank", async () => {
    await insertCard({ id: "blank", year: 1500, description: "   " });

    await expect(repository.findByIds(["blank"])).rejects.toThrow(InvalidCardError);
  });

  it("refuses to load a card whose description gives the date away", async () => {
    await insertCard({ id: "leak", year: 1500, description: "Un fait survenu en 1500." });

    await expect(repository.findByIds(["leak"])).rejects.toThrow(InvalidCardError);
  });

  it("finds cards by ids and ignores unknown ids", async () => {
    const cards = await repository.findByIds(["c2", "c3", "missing"]);

    expect(cards.map((card) => card.id).sort()).toEqual(["c2", "c3"]);
  });

  it("returns nothing for an empty id list", async () => {
    expect(await repository.findByIds([])).toEqual([]);
  });
});
