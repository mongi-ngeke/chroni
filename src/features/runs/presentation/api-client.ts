import { callApi } from "@/shared/api-call";
import { playResponseSchema, runResponseSchema, type PlayRequest, type PlayResponse, type RunResponse } from "./schemas";

export { ApiError } from "@/shared/api-call";

export interface RunsApi {
  startRun(): Promise<RunResponse>;
  playCard(runId: string, request: PlayRequest): Promise<PlayResponse>;
}

/** Client HTTP de l'API `runs`. `baseUrl` vide dans le navigateur, absolu dans les tests. */
export function createRunsApi(baseUrl = ""): RunsApi {
  return {
    startRun: () => callApi(`${baseUrl}/api/runs`, { method: "POST" }, runResponseSchema),
    playCard: (runId, request) =>
      callApi(
        `${baseUrl}/api/runs/${encodeURIComponent(runId)}/plays`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) },
        playResponseSchema,
      ),
  };
}
