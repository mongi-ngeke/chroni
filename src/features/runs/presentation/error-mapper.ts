import { toHttpError as toHttpErrorWith, type HttpError } from "@/shared/http-error";

/** Statut HTTP de chaque code métier de la feature runs. */
export const RUN_ERROR_STATUS: Readonly<Record<string, number>> = {
  RUN_NOT_FOUND: 404,
  CARD_NOT_IN_HAND: 422,
  INVALID_POSITION: 422,
  RUN_ALREADY_WON: 409,
};

export type { HttpError };

export function toHttpError(error: unknown): HttpError {
  return toHttpErrorWith(error, RUN_ERROR_STATUS);
}
