import "dotenv/config";
import { seedCardsInto } from "../src/features/cards/infrastructure/seed-cards";
import { db } from "../src/prisma/db";

const count = await seedCardsInto(db);
console.log(`Seeded ${count} cards`);
await db.close();
