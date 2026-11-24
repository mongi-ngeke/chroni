import type { Run } from "../domain/run";

/** Ports de la feature runs : implémentés dans `infrastructure/`. */
export interface RunRepository {
  save(run: Run): Promise<void>;
  findById(id: string): Promise<Run | null>;
}

export interface IdGenerator {
  next(): string;
}
