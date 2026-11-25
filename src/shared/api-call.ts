import { z, type ZodType } from "zod";

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

const errorBodySchema = z.strictObject({ code: z.string(), message: z.string() });

/**
 * Appelle une route de l'API et valide sa réponse avec `schema` (`null` : réponse sans corps,
 * comme un 204). Toute erreur devient une `ApiError` : un code métier de l'API, ou une panne de
 * transport.
 */
export async function callApi<T>(url: string, init: RequestInit, schema: ZodType<T> | null): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError("NETWORK_ERROR", "The server could not be reached");
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = errorBodySchema.safeParse(body);
    throw error.success
      ? new ApiError(error.data.code, error.data.message, response.status)
      : new ApiError("UNEXPECTED_RESPONSE", `Unexpected response (HTTP ${response.status})`, response.status);
  }

  if (schema === null) {
    return undefined as T;
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError("UNEXPECTED_RESPONSE", "The server returned an unexpected payload", response.status);
  }
  return parsed.data;
}
