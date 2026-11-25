import type { Session } from "../../domain/session";
import type { User } from "../../domain/user";
import type {
  AuthDeps,
  Clock,
  IdGenerator,
  PasswordHasher,
  SessionRepository,
  SessionTokens,
  UserRepository,
} from "../ports";

// Doublures pour les tests des cas d'usage (aucune base, aucun réseau, aucun aléatoire).

export class InMemoryUserRepository implements UserRepository {
  readonly saved = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return [...this.saved.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.saved.get(id) ?? null;
  }

  async create(user: User): Promise<void> {
    this.saved.set(user.id, user);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  readonly saved = new Map<string, Session>();

  async create(session: Session): Promise<void> {
    this.saved.set(session.id, session);
  }

  async findById(id: string): Promise<Session | null> {
    return this.saved.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.saved.delete(id);
  }
}

/** Empreinte lisible, et compteur d'appels pour vérifier qu'un email inconnu coûte un hachage. */
export class FakePasswordHasher implements PasswordHasher {
  hashCalls = 0;

  async hash(password: string): Promise<string> {
    this.hashCalls += 1;
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

export class SequentialSessionTokens implements SessionTokens {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }

  digest(token: string): string {
    return `digest:${token}`;
  }
}

export class FixedClock implements Clock {
  constructor(public current: Date) {}

  now(): Date {
    return this.current;
  }
}

export class SequentialUserIds implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `user-${this.counter}`;
  }
}

export function inMemoryAuth(now = new Date("2026-01-01T00:00:00Z")) {
  const deps = {
    users: new InMemoryUserRepository(),
    sessions: new InMemorySessionRepository(),
    passwords: new FakePasswordHasher(),
    tokens: new SequentialSessionTokens(),
    clock: new FixedClock(now),
    ids: new SequentialUserIds(),
  };
  return deps satisfies AuthDeps;
}
