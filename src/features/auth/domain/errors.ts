import { DomainError } from "@/shared/domain-error";

/** Erreur métier de la feature auth, avec un code stable repris tel quel par l'API. */
export abstract class AuthError extends DomainError {}

export class InvalidEmailError extends AuthError {
  readonly code = "INVALID_EMAIL";

  constructor() {
    super("The email address is not valid");
  }
}

export class WeakPasswordError extends AuthError {
  readonly code = "WEAK_PASSWORD";

  constructor(min: number, max: number) {
    super(`The password must be between ${min} and ${max} characters long`);
  }
}
