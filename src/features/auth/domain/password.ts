import { WeakPasswordError } from "./errors";

export const PASSWORD_MIN_LENGTH = 8;
/** Plafond : le hachage coûte cher, un mot de passe démesuré ne doit pas pouvoir saturer le serveur. */
export const PASSWORD_MAX_LENGTH = 128;

/** Vérifie la longueur d'un nouveau mot de passe. Il n'est jamais rogné : chaque caractère compte. */
export function assertAcceptablePassword(password: string): void {
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    throw new WeakPasswordError(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH);
  }
}
