import type { Card, CardRepository } from "@/features/cards";
import type { Run } from "../../domain/run";
import type { IdGenerator, RunRepository } from "../ports";

// Doublures pour les tests des cas d'usage (aucune base, aucun réseau).

export class InMemoryRunRepository implements RunRepository {
  readonly saved = new Map<string, Run>();

  async save(run: Run): Promise<void> {
    this.saved.set(run.id, run);
  }

  async findById(id: string): Promise<Run | null> {
    return this.saved.get(id) ?? null;
  }
}

export class InMemoryCardRepository implements CardRepository {
  constructor(private readonly cards: Card[]) {}

  async findAll(): Promise<Card[]> {
    return [...this.cards];
  }

  async findByIds(ids: readonly string[]): Promise<Card[]> {
    return this.cards.filter((card) => ids.includes(card.id));
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `run-${this.counter}`;
  }
}
