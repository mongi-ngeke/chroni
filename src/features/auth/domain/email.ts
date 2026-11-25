import { InvalidEmailError } from "./errors";

/** Longueur maximale d'une adresse (RFC 5321). */
const MAX_LENGTH = 254;
// Volontairement simple : une partie locale, un @, un domaine avec un point, sans espace.
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Forme canonique d'un email : sans espaces autour, en minuscules. Deux saisies qui ne diffèrent
 * que par la casse désignent le même compte.
 */
export function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  if (email.length > MAX_LENGTH || !SHAPE.test(email)) {
    throw new InvalidEmailError();
  }
  return email;
}
