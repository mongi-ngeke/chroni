import type { CardRepository } from "@/features/cards";
import { Run, type Shuffle } from "../domain/run";
import type { IdGenerator, RunRepository } from "./ports";

export interface StartRunDeps {
  runs: RunRepository;
  cards: CardRepository;
  shuffle: Shuffle;
  ids: IdGenerator;
}

export async function startRun({ runs, cards, shuffle, ids }: StartRunDeps): Promise<Run> {
  const run = Run.start({ id: ids.next(), cards: await cards.findAll(), shuffle });
  await runs.save(run);
  return run;
}
