import { Session } from "../domain/session";
import type { User } from "../domain/user";
import type { AuthDeps, OpenedSession } from "./ports";

/** Ouvre une session pour `user` : le jeton est renvoyé, seule son empreinte est enregistrée. */
export async function openSession(
  { sessions, tokens, clock }: Pick<AuthDeps, "sessions" | "tokens" | "clock">,
  user: User,
): Promise<OpenedSession> {
  const token = tokens.generate();
  const session = Session.open({ id: tokens.digest(token), userId: user.id, now: clock.now() });
  await sessions.create(session);
  return { user, token, expiresAt: session.expiresAt };
}
