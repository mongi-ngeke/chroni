import { z } from "zod";

// Bornes larges : elles protègent le serveur d'un corps démesuré. Les vraies règles (forme de
// l'email, longueur du mot de passe) sont celles du domaine, avec leurs codes d'erreur.
export const credentialsRequestSchema = z.strictObject({
  email: z.string().max(320),
  password: z.string().max(1024),
});

/** Un compte vu par le client : jamais d'empreinte de mot de passe. */
export const userResponseSchema = z.strictObject({
  id: z.string(),
  email: z.string(),
});

export const sessionResponseSchema = z.strictObject({
  user: userResponseSchema,
});

export type CredentialsRequest = z.infer<typeof credentialsRequestSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
