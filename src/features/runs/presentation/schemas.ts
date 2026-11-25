import { z } from "zod";

// Deux types distincts : une carte masquée n'a pas de champ `year`, et le schéma
// strict refuse toute réponse qui en contiendrait un (date jamais envoyée avant révélation).
//
// La description et l'image sont visibles dès la main : le domaine garantit qu'elles ne contiennent
// pas l'année. Le crédit de l'image n'est pas envoyé ici, il est servi par la page /credits.
export const cardImageSchema = z.strictObject({
  url: z.url(),
  alt: z.string(),
});

export const hiddenCardSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string(),
  image: cardImageSchema,
});

export const revealedCardSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string(),
  image: cardImageSchema,
  year: z.number().int(),
});

export const runResponseSchema = z.strictObject({
  id: z.string(),
  status: z.enum(["in_progress", "won"]),
  /** Cartes posées, dans l'ordre chronologique, dates visibles. */
  timeline: z.array(revealedCardSchema),
  /** Main du joueur : dates masquées. */
  hand: z.array(hiddenCardSchema),
  drawPileCount: z.number().int().nonnegative(),
  /** Cartes révélées par une erreur de placement. */
  discard: z.array(revealedCardSchema),
});

export const playRequestSchema = z.strictObject({
  cardId: z.string().min(1),
  position: z.number().int().nonnegative(),
});

export const playResponseSchema = z.strictObject({
  outcome: z.enum(["correct", "incorrect"]),
  /** La carte jouée est révélée dans les deux cas. */
  card: revealedCardSchema,
  /** Carte piochée après une erreur : date masquée. */
  drawnCard: hiddenCardSchema.optional(),
  run: runResponseSchema,
});

export const errorResponseSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
});

export type HiddenCard = z.infer<typeof hiddenCardSchema>;
export type RevealedCard = z.infer<typeof revealedCardSchema>;
export type RunResponse = z.infer<typeof runResponseSchema>;
export type PlayRequest = z.infer<typeof playRequestSchema>;
export type PlayResponse = z.infer<typeof playResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
