import { callApi } from "@/shared/api-call";
import { sessionResponseSchema, type CredentialsRequest, type SessionResponse } from "./schemas";

export { ApiError } from "@/shared/api-call";

export interface AuthApi {
  signUp(credentials: CredentialsRequest): Promise<SessionResponse>;
  logIn(credentials: CredentialsRequest): Promise<SessionResponse>;
  logOut(): Promise<void>;
}

/**
 * Client HTTP de l'authentification. Le cookie de session est posé et effacé par le serveur
 * (`HttpOnly`) : le navigateur le gère seul, ce client ne le lit jamais.
 */
export function createAuthApi(baseUrl = ""): AuthApi {
  const postCredentials = (path: string, credentials: CredentialsRequest) =>
    callApi(
      `${baseUrl}${path}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) },
      sessionResponseSchema,
    );

  return {
    signUp: (credentials) => postCredentials("/api/users", credentials),
    logIn: (credentials) => postCredentials("/api/sessions", credentials),
    logOut: () => callApi(`${baseUrl}/api/sessions/current`, { method: "DELETE" }, null),
  };
}
