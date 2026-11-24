import { PrismaCardRepository } from "@/features/cards/infrastructure/prisma-card-repository";
import { PrismaRunRepository } from "@/features/runs/infrastructure/prisma-run-repository";
import { createShuffle } from "@/features/runs/infrastructure/crypto-shuffle";
import { UuidIdGenerator } from "@/features/runs/infrastructure/uuid-id-generator";
import { db } from "@/prisma/db";

// Racine de composition : seul endroit qui assemble les ports et leurs implémentations.
const cards = new PrismaCardRepository(db);

export const container = {
  runs: new PrismaRunRepository(db, cards),
  cards,
  shuffle: createShuffle(),
  ids: new UuidIdGenerator(),
};
