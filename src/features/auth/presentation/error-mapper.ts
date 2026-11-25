/** Statut HTTP de chaque code métier de la feature auth. */
export const AUTH_ERROR_STATUS: Readonly<Record<string, number>> = {
  INVALID_EMAIL: 422,
  WEAK_PASSWORD: 422,
  EMAIL_ALREADY_USED: 409,
  INVALID_CREDENTIALS: 401,
};
