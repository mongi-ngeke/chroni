import { CryptoSessionTokens } from "@/features/auth/infrastructure/crypto-session-tokens";
import { PrismaSessionRepository } from "@/features/auth/infrastructure/prisma-session-repository";
import { PrismaUserRepository } from "@/features/auth/infrastructure/prisma-user-repository";
import { ScryptPasswordHasher } from "@/features/auth/infrastructure/scrypt-password-hasher";
import { SystemClock } from "@/features/auth/infrastructure/system-clock";
import { PrismaCardRepository } from "@/features/cards/infrastructure/prisma-card-repository";
import { PrismaRunRepository } from "@/features/runs/infrastructure/prisma-run-repository";
import { createShuffle } from "@/features/runs/infrastructure/crypto-shuffle";
import { UuidIdGenerator } from "@/features/runs/infrastructure/uuid-id-generator";
import { db } from "@/prisma/db";

// Racine de composition : seul endroit qui assemble les ports et leurs implémentations.
const cards = new PrismaCardRepository(db);
const ids = new UuidIdGenerator();

export const container = {
  runs: new PrismaRunRepository(db, cards),
  cards,
  shuffle: createShuffle(),
  ids,
  auth: {
    users: new PrismaUserRepository(db),
    sessions: new PrismaSessionRepository(db),
    passwords: new ScryptPasswordHasher(),
    tokens: new CryptoSessionTokens(),
    clock: new SystemClock(),
    ids,
  },
};
