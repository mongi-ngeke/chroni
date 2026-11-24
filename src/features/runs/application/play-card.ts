import type { PlayResult } from "../domain/run";
import { getRun } from "./get-run";
import type { RunRepository } from "./ports";

export interface PlayCardCommand {
  runId: string;
  cardId: string;
  position: number;
}

export async function playCard(
  deps: { runs: RunRepository },
  { runId, cardId, position }: PlayCardCommand,
): Promise<PlayResult> {
  const run = await getRun(deps, runId);
  const result = run.playCard({ cardId, position });
  await deps.runs.save(result.run);
  return result;
}
