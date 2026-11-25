import { normalizeEmail } from "./email";

export interface UserProps {
  id: string;
  /** Saisi par le joueur : normalisé à la création. */
  email: string;
  /** Empreinte du mot de passe (jamais le mot de passe lui-même). */
  passwordHash: string;
}

/** Joueur inscrit. */
export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly passwordHash: string,
  ) {}

  static create({ id, email, passwordHash }: UserProps): User {
    return new User(id, normalizeEmail(email), passwordHash);
  }
}
