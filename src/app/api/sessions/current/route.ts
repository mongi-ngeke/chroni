import { container } from "@/app/container";
import { logOut } from "@/features/auth/application/log-out";
import { env } from "@/shared/env";
import { errorResponse } from "../../http";
import { clearedSessionCookie, readSessionToken } from "../../session-cookie";

/** Déconnexion : ferme la session du cookie et efface le cookie. Idempotente. */
export async function DELETE(request: Request): Promise<Response> {
  try {
    await logOut(container.auth, readSessionToken(request.headers.get("cookie")));
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": clearedSessionCookie({ secure: env.NODE_ENV === "production" }) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
