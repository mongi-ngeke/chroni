import type { User } from "../domain/user";
import type { AuthDeps } from "./ports";

/**
 * Joueur connecté avec ce jeton, ou `null` : pas de jeton, jeton inconnu, session expirée (alors
 * supprimée) ou compte disparu. Ne lève jamais d'erreur d'authentification : jouer en invité reste
 * permis.
 */
export async function currentUser(
  { users, sessions, tokens, clock }: Pick<AuthDeps, "users" | "sessions" | "tokens" | "clock">,
  token: string | undefined,
): Promise<User | null> {
  if (token === undefined || token === "") return null;
  const session = await sessions.findById(tokens.digest(token));
  if (session === null) return null;
  if (session.isExpiredAt(clock.now())) {
    await sessions.delete(session.id);
    return null;
  }
  return users.findById(session.userId);
}
