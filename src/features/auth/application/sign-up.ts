import { normalizeEmail } from "../domain/email";
import { assertAcceptablePassword } from "../domain/password";
import { User } from "../domain/user";
import { EmailAlreadyUsedError } from "./errors";
import { openSession } from "./open-session";
import type { AuthDeps, OpenedSession } from "./ports";

export interface Credentials {
  email: string;
  password: string;
}

/** Crée un compte et connecte aussitôt le joueur. */
export async function signUp(deps: AuthDeps, { email, password }: Credentials): Promise<OpenedSession> {
  const normalized = normalizeEmail(email);
  assertAcceptablePassword(password);
  if ((await deps.users.findByEmail(normalized)) !== null) {
    throw new EmailAlreadyUsedError();
  }
  const user = User.create({
    id: deps.ids.next(),
    email: normalized,
    passwordHash: await deps.passwords.hash(password),
  });
  await deps.users.create(user);
  return openSession(deps, user);
}
