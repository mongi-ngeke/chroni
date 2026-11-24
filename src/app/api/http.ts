import type { ZodType } from "zod";
import { toHttpError } from "@/features/runs/presentation/error-mapper";

export function errorResponse(error: unknown): Response {
  const { status, body } = toHttpError(error);
  return Response.json(body, { status });
}

export function invalidRequest(message: string): Response {
  return Response.json({ code: "INVALID_REQUEST", message }, { status: 400 });
}

/** Lit et valide le corps JSON ; renvoie la réponse 400 à retourner telle quelle en cas d'échec. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<{ data: T } | { error: Response }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { error: invalidRequest("Request body must be valid JSON") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`);
    return { error: invalidRequest(details.join("; ")) };
  }
  return { data: result.data };
}
