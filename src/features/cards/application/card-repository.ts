import type { Card } from "../domain/card";

/** Port : accès aux cartes. Implémenté dans `infrastructure/`. */
export interface CardRepository {
  findAll(): Promise<Card[]>;
  /** Cartes existantes parmi `ids` ; l'ordre n'est pas garanti. */
  findByIds(ids: readonly string[]): Promise<Card[]>;
}
