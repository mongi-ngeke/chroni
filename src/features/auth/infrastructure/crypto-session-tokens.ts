import { createHash, randomBytes } from "node:crypto";
import type { SessionTokens } from "../application/ports";

/**
 * Jeton de 256 bits aléatoires, impossible à deviner. La base n'en garde que l'empreinte SHA-256 :
 * une fuite de la base ne permet pas de se connecter à la place d'un joueur. Un hachage rapide
 * suffit ici, contrairement aux mots de passe : le jeton est déjà aléatoire.
 */
export class CryptoSessionTokens implements SessionTokens {
  generate(): string {
    return randomBytes(32).toString("base64url");
  }

  digest(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
