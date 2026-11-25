import type { PlayResult } from "../domain/run";
import { getRun } from "./get-run";
import type { RunRepository } from "./ports";

export interface PlayCardCommand {
  runId: string;
  /** Joueur connecté, ou `null` pour un invité : seul le propriétaire joue une partie privée. */
  playerId: string | null;
  cardId: string;
  position: number;
}

export async function playCard(
  deps: { runs: RunRepository },
  { runId, playerId, cardId, position }: PlayCardCommand,
): Promise<PlayResult> {
  const run = await getRun(deps, runId, playerId);
  const result = run.playCard({ cardId, position });
  await deps.runs.save(result.run);
  return result;
}
