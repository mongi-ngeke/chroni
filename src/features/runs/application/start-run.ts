import type { CardRepository } from "@/features/cards";
import { Run, type Shuffle } from "../domain/run";
import type { IdGenerator, RunRepository } from "./ports";

export interface StartRunDeps {
  runs: RunRepository;
  cards: CardRepository;
  shuffle: Shuffle;
  ids: IdGenerator;
}

/** Lance une partie : privée si `playerId` désigne un joueur connecté, d'invité sinon. */
export async function startRun({ runs, cards, shuffle, ids }: StartRunDeps, playerId: string | null): Promise<Run> {
  const run = Run.start({ id: ids.next(), cards: await cards.findAll(), shuffle, ownerId: playerId });
  await runs.save(run);
  return run;
}
