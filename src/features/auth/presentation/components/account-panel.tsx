import Link from "next/link";
import { LogoutButton } from "./logout-button";

/**
 * Compte du joueur, dans le volet de la partie : connecté (parties privées, déconnexion) ou
 * invité (invitation à se connecter).
 */
export function AccountPanel({ email }: { email: string | null }) {
  if (email === null) {
    return (
      <section aria-label="Compte" className="flex flex-col gap-1 text-sm text-stone-700">
        <p className="font-medium">Partie en invité</p>
        <p className="text-stone-500">Toute personne qui a son adresse peut la reprendre.</p>
        <Link href="/login" className="self-start underline hover:text-stone-900">
          Se connecter pour jouer en privé
        </Link>
      </section>
    );
  }
  return (
    <section aria-label="Compte" className="flex flex-col gap-1 text-sm text-stone-700">
      <p>
        Connecté : <span className="font-medium break-all">{email}</span>
      </p>
      <p className="text-stone-500">Vos parties sont privées.</p>
      <LogoutButton />
    </section>
  );
}
