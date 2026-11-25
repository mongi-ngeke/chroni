"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createAuthApi } from "../api-client";

/** Ferme la session puis revient à l'accueil, déconnecté. */
export function LogoutButton() {
  const router = useRouter();
  const api = useMemo(() => createAuthApi(), []);
  const [pending, setPending] = useState(false);

  async function logOut() {
    setPending(true);
    try {
      await api.logOut();
    } finally {
      // Même en cas d'échec réseau, on recharge : la page affiche l'état réel de la session.
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logOut}
      disabled={pending}
      className="self-start text-sm text-stone-600 underline hover:text-stone-900 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
