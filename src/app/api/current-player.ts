import { container } from "@/app/container";
import { currentUser } from "@/features/auth/application/current-user";
import { readSessionToken } from "./session-cookie";

/** Joueur connecté à l'origine de la requête (d'après son cookie), ou `null` pour un invité. */
export async function currentPlayerId(request: Request): Promise<string | null> {
  const user = await currentUser(container.auth, readSessionToken(request.headers.get("cookie")));
  return user?.id ?? null;
}
