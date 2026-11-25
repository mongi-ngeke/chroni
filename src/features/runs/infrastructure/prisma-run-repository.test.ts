import { beforeEach, describe, expect, it } from "vitest";
import { Card, type CardRepository } from "@/features/cards";
import { db } from "@/prisma/db";
import { insertCard, resetDatabase } from "@tests/support/database";
import { PrismaCardRepository } from "@/features/cards/infrastructure/prisma-card-repository";
import { Run } from "../domain/run";
import { PrismaRunRepository } from "./prisma-run-repository";

const cardRepository: CardRepository = new PrismaCardRepository(db);
const repository = new PrismaRunRepository(db, cardRepository);
const ids = (cards: readonly Card[]) => cards.map((card) => card.id);

async function seedCards(count: number): Promise<Card[]> {
  for (let i = 1; i <= count; i += 1) {
    await insertCard({ id: `c${i}`, year: 1000 + i });
  }
  return cardRepository.findAll();
}

const keepOrder = <T>(items: readonly T[]): T[] => [...items];

beforeEach(resetDatabase);

describe("PrismaRunRepository", () => {
  it("returns null for an unknown run", async () => {
    expect(await repository.findById("nope")).toBeNull();
  });

  it("round-trips a started run, keeping every zone and its order", async () => {
    const cards = (await seedCards(15)).sort((a, b) => a.year - b.year);
    const run = Run.start({ id: "run-1", cards, shuffle: keepOrder });

    await repository.save(run);
    const loaded = await repository.findById("run-1");

    expect(loaded?.status).toBe("in_progress");
    expect(ids(loaded?.timeline ?? [])).toEqual(ids(run.timeline));
    expect(ids(loaded?.drawPile ?? [])).toEqual(ids(run.drawPile));
    expect(ids(loaded?.hand ?? []).sort()).toEqual(ids(run.hand).sort());
    expect(loaded?.discard).toHaveLength(0);
    expect(loaded?.timeline[0]?.year).toBe(run.timeline[0]?.year);
  });

  it("overwrites the stored state on a second save (discard, draw, victory)", async () => {
    const cards = (await seedCards(12)).sort((a, b) => a.year - b.year);
    const started = Run.start({ id: "run-1", cards, shuffle: keepOrder });
    await repository.save(started);

    // Le départ est la carte la plus ancienne : jouer une carte de la main à gauche est une erreur.
    const wrong = started.hand[0];
    if (wrong === undefined) throw new Error("hand should not be empty");
    const { run: afterError } = started.playCard({ cardId: wrong.id, position: 0 });
    await repository.save(afterError);

    const loaded = await repository.findById("run-1");
    expect(ids(loaded?.discard ?? [])).toEqual([wrong.id]);
    expect(loaded?.hand).toHaveLength(10);
    expect(loaded?.drawPile).toHaveLength(0);
  });

  it("persists the won status", async () => {
    await seedCards(11);
    const cards = (await cardRepository.findAll()).sort((a, b) => a.year - b.year);
    let run = Run.start({ id: "run-1", cards, shuffle: keepOrder });
    while (run.status === "in_progress") {
      const next = run.hand[0];
      if (next === undefined) throw new Error("hand should not be empty");
      run = run.playCard({ cardId: next.id, position: run.timeline.length }).run;
    }

    await repository.save(run);

    const loaded = await repository.findById("run-1");
    expect(loaded?.status).toBe("won");
    expect(loaded?.hand).toHaveLength(0);
    expect(loaded?.timeline).toHaveLength(11);
  });

  it("keeps runs independent of each other", async () => {
    const cards = await seedCards(11);
    await repository.save(Run.start({ id: "a", cards, shuffle: keepOrder }));
    await repository.save(Run.start({ id: "b", cards, shuffle: (items) => [...items].reverse() }));

    const a = await repository.findById("a");
    const b = await repository.findById("b");

    expect(a?.timeline[0]?.id).not.toBe(b?.timeline[0]?.id);
  });
});
