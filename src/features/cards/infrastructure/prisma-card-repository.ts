import type { Db } from "@/prisma/db";
import type { CardRepository } from "../application/card-repository";
import { Card } from "../domain/card";

interface CardRow {
  id: string;
  title: string;
  year: number;
  category: string | null;
  description: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
}

// Les modèles Prisma ne sortent pas de l'infrastructure : on les convertit ici.
function toDomain(row: CardRow): Card {
  return Card.create({
    id: row.id,
    title: row.title,
    year: row.year,
    category: row.category ?? undefined,
    description: row.description,
    image: { url: row.imageUrl, alt: row.imageAlt, credit: row.imageCredit },
  });
}

export class PrismaCardRepository implements CardRepository {
  constructor(private readonly db: Db) {}

  async findAll(): Promise<Card[]> {
    const rows = await this.db.orm.public.Card.all();
    return rows.map(toDomain);
  }

  async findByIds(ids: readonly string[]): Promise<Card[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db.orm.public.Card.where((card) => card.id.in([...ids])).all();
    return rows.map(toDomain);
  }
}
