import { RunError } from "../domain/errors";
import type { ErrorResponse } from "./schemas";

const STATUS_BY_CODE: Record<string, number> = {
  RUN_NOT_FOUND: 404,
  CARD_NOT_IN_HAND: 422,
  INVALID_POSITION: 422,
  RUN_ALREADY_WON: 409,
};

export interface HttpError {
  status: number;
  body: ErrorResponse;
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof RunError) {
    // Un code métier inconnu ici (ex. NOT_ENOUGH_CARDS) est une panne côté serveur, pas une faute du client.
    return { status: STATUS_BY_CODE[error.code] ?? 500, body: { code: error.code, message: error.message } };
  }
  // Pas de détail interne dans la réponse.
  return { status: 500, body: { code: "INTERNAL_ERROR", message: "Unexpected error" } };
}
