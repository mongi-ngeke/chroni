/** Durée d'une session : le joueur reste connecté 30 jours sans se reconnecter. */
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionProps {
  /** Empreinte du jeton du cookie : le jeton lui-même n'est connu que du navigateur. */
  id: string;
  userId: string;
  expiresAt: Date;
}

/** Session de connexion d'un joueur. */
export class Session {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly expiresAt: Date,
  ) {}

  /** Ouvre une session qui expire `SESSION_DURATION_MS` après `now`. */
  static open({ id, userId, now }: { id: string; userId: string; now: Date }): Session {
    return new Session(id, userId, new Date(now.getTime() + SESSION_DURATION_MS));
  }

  static restore({ id, userId, expiresAt }: SessionProps): Session {
    return new Session(id, userId, expiresAt);
  }

  /** Expirée à l'instant exact de son échéance. */
  isExpiredAt(now: Date): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }
}
