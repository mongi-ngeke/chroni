import type { User } from "../domain/user";
import type { SessionResponse } from "./schemas";

/** Le DTO ne reprend que l'identifiant et l'email : l'empreinte du mot de passe ne sort jamais. */
export function toSessionResponse(user: User): SessionResponse {
  return { user: { id: user.id, email: user.email } };
}
