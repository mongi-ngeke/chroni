import type { AuthDeps } from "./ports";

/** Ferme la session du jeton. Sans jeton, ou session déjà fermée : rien à faire. */
export async function logOut(
  { sessions, tokens }: Pick<AuthDeps, "sessions" | "tokens">,
  token: string | undefined,
): Promise<void> {
  if (token === undefined || token === "") return;
  await sessions.delete(tokens.digest(token));
}
