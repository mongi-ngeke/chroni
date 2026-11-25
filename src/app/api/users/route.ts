import { container } from "@/app/container";
import { signUp } from "@/features/auth/application/sign-up";
import { toSessionResponse } from "@/features/auth/presentation/mappers";
import { credentialsRequestSchema } from "@/features/auth/presentation/schemas";
import { env } from "@/shared/env";
import { errorResponse, parseBody } from "../http";
import { sessionCookie } from "../session-cookie";

/** Inscription : crée le compte et connecte aussitôt le joueur. */
export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseBody(request, credentialsRequestSchema);
    if ("error" in parsed) {
      return parsed.error;
    }
    const { user, token, expiresAt } = await signUp(container.auth, parsed.data);
    return Response.json(toSessionResponse(user), {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(token, expiresAt, { secure: env.NODE_ENV === "production" }) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
