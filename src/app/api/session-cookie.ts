/**
 * Cookie de session, lu et écrit par les en-têtes HTTP : les routes restent testables sans le
 * contexte de requête de Next. Le cookie ne porte qu'un jeton aléatoire, sans donnée personnelle.
 */
export const SESSION_COOKIE = "chroni_session";

interface CookieOptions {
  /** `Secure` en production : le cookie ne voyage alors qu'en HTTPS. */
  secure: boolean;
}

function attributes({ secure }: CookieOptions): string[] {
  // HttpOnly : invisible au JavaScript de la page. SameSite=Lax : pas envoyé par un formulaire ou
  // un fetch venus d'un autre site, ce qui protège les routes qui modifient l'état.
  return ["Path=/", "HttpOnly", "SameSite=Lax", ...(secure ? ["Secure"] : [])];
}

export function sessionCookie(token: string, expiresAt: Date, options: CookieOptions): string {
  return [`${SESSION_COOKIE}=${token}`, `Expires=${expiresAt.toUTCString()}`, ...attributes(options)].join("; ");
}

/** Efface le cookie dans le navigateur. */
export function clearedSessionCookie(options: CookieOptions): string {
  return [`${SESSION_COOKIE}=`, "Max-Age=0", ...attributes(options)].join("; ");
}

/** Jeton de session présent dans l'en-tête `Cookie`, s'il y en a un. */
export function readSessionToken(cookieHeader: string | null): string | undefined {
  if (cookieHeader === null) return undefined;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator !== -1 && pair.slice(0, separator).trim() === SESSION_COOKIE) {
      const value = pair.slice(separator + 1).trim();
      return value === "" ? undefined : value;
    }
  }
  return undefined;
}
