import type { Card, CardRepository } from "@/features/cards";
import type { Db } from "@/prisma/db";
import type { RunRepository } from "../application/ports";
import { Run } from "../domain/run";

type Zone = "timeline" | "hand" | "draw_pile" | "discard";

interface RunCardRow {
  runId: string;
  cardId: string;
  zone: Zone;
  position: number;
}

function toRows(run: Run): RunCardRow[] {
  const zones: [Zone, readonly Card[]][] = [
    ["timeline", run.timeline],
    ["hand", run.hand],
    ["draw_pile", run.drawPile],
    ["discard", run.discard],
  ];
  return zones.flatMap(([zone, cards]) =>
    cards.map((card, position) => ({ runId: run.id, cardId: card.id, zone, position })),
  );
}

export class PrismaRunRepository implements RunRepository {
  // Les cartes passent par le port de la feature cards, pas par ses tables.
  constructor(
    private readonly db: Db,
    private readonly cards: CardRepository,
  ) {}

  async save(run: Run): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.orm.public.Run.upsert({
        // Le propriétaire est fixé à la création : une partie ne change jamais de main.
        create: { id: run.id, status: run.status, userId: run.ownerId },
        update: { status: run.status },
      });
      // Le run est petit (≤ 100 cartes) : on réécrit son état d'un bloc, sans conflit de position.
      await tx.orm.public.RunCard.where({ runId: run.id }).deleteAll();
      await tx.orm.public.RunCard.createAll(toRows(run));
    });
  }

  async findById(id: string): Promise<Run | null> {
    const row = await this.db.orm.public.Run.first({ id });
    if (row === null) {
      return null;
    }
    const runCards = await this.db.orm.public.RunCard.where({ runId: id }).all();
    const cards = await this.cards.findByIds(runCards.map((runCard) => runCard.cardId));
    const byId = new Map(cards.map((card) => [card.id, card]));

    const inZone = (zone: Zone): Card[] =>
      runCards
        .filter((runCard) => runCard.zone === zone)
        .sort((a, b) => a.position - b.position)
        .map((runCard) => {
          const card = byId.get(runCard.cardId);
          if (card === undefined) {
            throw new Error(`Card ${runCard.cardId} of run ${id} no longer exists`);
          }
          return card;
        });

    return Run.restore({
      id,
      status: row.status,
      ownerId: row.userId,
      timeline: inZone("timeline"),
      hand: inZone("hand"),
      drawPile: inZone("draw_pile"),
      discard: inZone("discard"),
    });
  }
}
