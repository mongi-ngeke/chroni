import { randomInt } from "node:crypto";
import type { Shuffle } from "../domain/run";

/** Fisher-Yates ; `random(max)` renvoie un entier dans [0, max) (injectable pour les tests). */
export function createShuffle(random: (max: number) => number = (max) => randomInt(max)): Shuffle {
  return <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = random(i + 1);
      const a = result[i] as T;
      result[i] = result[j] as T;
      result[j] = a;
    }
    return result;
  };
}
