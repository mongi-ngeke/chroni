import { RunError } from "../domain/errors";

export class RunNotFoundError extends RunError {
  readonly code = "RUN_NOT_FOUND";

  constructor(runId: string) {
    super(`Run ${runId} not found`);
  }
}
