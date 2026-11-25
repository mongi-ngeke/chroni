import type { Run } from "../domain/run";
import { RunNotFoundError } from "./errors";
import type { RunRepository } from "./ports";

/**
 * Partie demandée par `playerId` (joueur connecté, ou `null` pour un invité). La partie privée d'un
 * autre joueur est introuvable, comme une partie inexistante : on ne révèle pas qu'elle existe.
 */
export async function getRun({ runs }: { runs: RunRepository }, runId: string, playerId: string | null): Promise<Run> {
  const run = await runs.findById(runId);
  if (run === null || !run.isAccessibleBy(playerId)) {
    throw new RunNotFoundError(runId);
  }
  return run;
}
