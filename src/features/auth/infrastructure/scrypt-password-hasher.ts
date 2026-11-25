import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { PasswordHasher } from "../application/ports";

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export interface ScryptParams {
  /** Coût CPU et mémoire (puissance de 2). */
  N: number;
  r: number;
  p: number;
}

/** 2^15 × 8 × 128 octets = 32 Mio de mémoire par hachage : coûteux pour un attaquant, rapide pour un joueur. */
export const DEFAULT_SCRYPT_PARAMS: ScryptParams = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = "scrypt";

/**
 * Empreinte scrypt (module `crypto` de Node, sans dépendance). Format auto-descriptif :
 * `scrypt$N$r$p$sel$empreinte` (base64url), pour pouvoir durcir les paramètres plus tard sans
 * invalider les mots de passe déjà enregistrés.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  constructor(private readonly params: ScryptParams = DEFAULT_SCRYPT_PARAMS) {}

  async hash(password: string): Promise<string> {
    const { N, r, p } = this.params;
    const salt = randomBytes(SALT_LENGTH);
    const key = await scrypt(password, salt, KEY_LENGTH, { N, r, p, maxmem: maxMemory(this.params) });
    return [PREFIX, N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const parsed = parse(hash);
    if (parsed === null) return false;
    const { params, salt, key } = parsed;
    const candidate = await scrypt(password, salt, key.length, { ...params, maxmem: maxMemory(params) });
    // Comparaison à temps constant : le temps de réponse ne dit rien de l'empreinte.
    return timingSafeEqual(candidate, key);
  }
}

/** Mémoire nécessaire à scrypt, avec de la marge (Node refuse au-delà de `maxmem`). */
function maxMemory({ N, r }: ScryptParams): number {
  return 2 * 128 * N * r;
}

function parse(hash: string): { params: ScryptParams; salt: Buffer; key: Buffer } | null {
  const parts = hash.split("$");
  if (parts.length !== 6 || parts[0] !== PREFIX) return null;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  const salt = Buffer.from(parts[4] ?? "", "base64url");
  const key = Buffer.from(parts[5] ?? "", "base64url");
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || salt.length === 0 || key.length === 0) {
    return null;
  }
  return { params: { N: N as number, r: r as number, p: p as number }, salt, key };
}
