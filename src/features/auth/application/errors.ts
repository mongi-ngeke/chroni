import { AuthError } from "../domain/errors";

export class EmailAlreadyUsedError extends AuthError {
  readonly code = "EMAIL_ALREADY_USED";

  constructor() {
    super("An account already uses this email address");
  }
}

/** Volontairement vague : ne dit pas si c'est l'email ou le mot de passe qui est faux. */
export class InvalidCredentialsError extends AuthError {
  readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super("Invalid email or password");
  }
}
