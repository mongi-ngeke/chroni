import type { ZodType } from "zod";
import {
  errorResponseSchema,
  playResponseSchema,
  runResponseSchema,
  type PlayRequest,
  type PlayResponse,
  type RunResponse,
} from "./schemas";

/** Erreur de l'API (code métier stable) ou du transport (`NETWORK_ERROR`, `UNEXPECTED_RESPONSE`). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RunsApi {
  startRun(): Promise<RunResponse>;
  playCard(runId: string, request: PlayRequest): Promise<PlayResponse>;
}

/** Client HTTP de l'API `runs`. `baseUrl` vide dans le navigateur, absolu dans les tests. */
export function createRunsApi(baseUrl = ""): RunsApi {
  async function call<T>(path: string, init: RequestInit, schema: ZodType<T>): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, init);
    } catch {
      throw new ApiError("NETWORK_ERROR", "The server could not be reached");
    }

    const body: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      const error = errorResponseSchema.safeParse(body);
      throw error.success
        ? new ApiError(error.data.code, error.data.message, response.status)
        : new ApiError("UNEXPECTED_RESPONSE", `Unexpected response (HTTP ${response.status})`, response.status);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("UNEXPECTED_RESPONSE", "The server returned an unexpected payload", response.status);
    }
    return parsed.data;
  }

  return {
    startRun: () => call("/api/runs", { method: "POST" }, runResponseSchema),
    playCard: (runId, request) =>
      call(
        `/api/runs/${encodeURIComponent(runId)}/plays`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) },
        playResponseSchema,
      ),
  };
}
