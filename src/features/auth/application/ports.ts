import type { Session } from "../domain/session";
import type { User } from "../domain/user";

/** Ports de la feature auth : implémentés dans `infrastructure/`. */
export interface UserRepository {
  /** `email` est déjà normalisé. */
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
}

export interface SessionRepository {
  create(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
  /** Sans effet si la session n'existe plus. */
  delete(id: string): Promise<void>;
}

export interface PasswordHasher {
  /** Empreinte salée : deux appels avec le même mot de passe donnent deux empreintes différentes. */
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/** Jetons de session : le cookie porte le jeton, la base n'en garde que l'empreinte. */
export interface SessionTokens {
  generate(): string;
  digest(token: string): string;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface AuthDeps {
  users: UserRepository;
  sessions: SessionRepository;
  passwords: PasswordHasher;
  tokens: SessionTokens;
  clock: Clock;
  ids: IdGenerator;
}

/** Résultat d'une inscription ou d'une connexion : le jeton est à poser dans le cookie. */
export interface OpenedSession {
  user: User;
  token: string;
  expiresAt: Date;
}
