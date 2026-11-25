/**
 * Erreur métier avec un code stable, repris tel quel par l'API. Chaque feature en dérive sa propre
 * famille (`RunError`, `AuthError`) ; les routes traduisent toutes les familles de la même façon.
 * Pur : importable depuis un domaine.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
