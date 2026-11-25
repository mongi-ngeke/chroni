import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../domain/password";

export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Cette adresse email n'est pas valide.",
  WEAK_PASSWORD: `Le mot de passe doit faire entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères.`,
  EMAIL_ALREADY_USED: "Un compte existe déjà avec cette adresse. Connectez-vous plutôt.",
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect.",
  INVALID_REQUEST: "Le formulaire est incomplet.",
  NETWORK_ERROR: "Le serveur est injoignable. Vérifiez votre connexion et réessayez.",
};

/** Message affiché au joueur pour un code d'erreur de l'API. */
export function authErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Une erreur inattendue est survenue. Réessayez.";
}
