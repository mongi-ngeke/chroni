import { cookies } from "next/headers";
import { container } from "@/app/container";
import { currentUser } from "@/features/auth/application/current-user";
import type { User } from "@/features/auth/domain/user";
import { SESSION_COOKIE } from "./api/session-cookie";

/**
 * Joueur connecté, pour les pages serveur (lecture du cookie via Next), ou `null` pour un invité.
 * Les routes d'API utilisent `currentPlayerId(request)`, testable hors de Next.
 */
export async function currentPlayer(): Promise<User | null> {
  return currentUser(container.auth, (await cookies()).get(SESSION_COOKIE)?.value);
}
