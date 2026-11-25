import { DomainError } from "./domain-error";

export interface HttpError {
  status: number;
  body: { code: string; message: string };
}

/**
 * Traduit une erreur en réponse HTTP. `statusByCode` donne le statut de chaque code métier connu ;
 * un code absent (ex. NOT_ENOUGH_CARDS) est une panne côté serveur, pas une faute du client.
 */
export function toHttpError(error: unknown, statusByCode: Readonly<Record<string, number>>): HttpError {
  if (error instanceof DomainError) {
    return { status: statusByCode[error.code] ?? 500, body: { code: error.code, message: error.message } };
  }
  // Pas de détail interne dans la réponse.
  return { status: 500, body: { code: "INTERNAL_ERROR", message: "Unexpected error" } };
}
