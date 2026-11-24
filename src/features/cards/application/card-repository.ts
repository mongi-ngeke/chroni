import type { Card } from "../domain/card";

/** Port : accès aux cartes. Implémenté dans `infrastructure/`. */
export interface CardRepository {
  findAll(): Promise<Card[]>;
}
