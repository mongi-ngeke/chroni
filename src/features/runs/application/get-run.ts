import type { Run } from "../domain/run";
import { RunNotFoundError } from "./errors";
import type { RunRepository } from "./ports";

export async function getRun({ runs }: { runs: RunRepository }, runId: string): Promise<Run> {
  const run = await runs.findById(runId);
  if (run === null) {
    throw new RunNotFoundError(runId);
  }
  return run;
}
