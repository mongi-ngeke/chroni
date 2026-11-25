import { normalizeEmail } from "../domain/email";
import { InvalidEmailError } from "../domain/errors";
import { PASSWORD_MAX_LENGTH } from "../domain/password";
import { InvalidCredentialsError } from "./errors";
import { openSession } from "./open-session";
import type { AuthDeps, OpenedSession } from "./ports";
import type { Credentials } from "./sign-up";

/**
 * Connecte un joueur. Toute erreur d'identifiants donne la même réponse, et un email inconnu coûte
 * le même calcul qu'un mauvais mot de passe : ni le message ni le temps de réponse ne révèlent
 * qu'un compte existe.
 */
export async function logIn(deps: AuthDeps, { email, password }: Credentials): Promise<OpenedSession> {
  // Un mot de passe démesuré n'a jamais pu être enregistré : on le refuse sans le hacher.
  if ([...password].length > PASSWORD_MAX_LENGTH) {
    throw new InvalidCredentialsError();
  }
  let normalized: string;
  try {
    normalized = normalizeEmail(email);
  } catch (error) {
    if (error instanceof InvalidEmailError) throw new InvalidCredentialsError();
    throw error;
  }

  const user = await deps.users.findByEmail(normalized);
  if (user === null) {
    await deps.passwords.hash(password);
    throw new InvalidCredentialsError();
  }
  if (!(await deps.passwords.verify(password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }
  return openSession(deps, user);
}
