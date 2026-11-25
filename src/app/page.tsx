import Link from "next/link";
import { currentPlayer } from "@/app/current-player";
import { LogoutButton } from "@/features/auth/presentation/components/logout-button";
import { StartButton } from "@/features/runs/presentation/components/start-button";

// Dépend du cookie de session (joueur connecté ou invité) : jamais pré-rendue.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const player = await currentPlayer();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-4 text-center sm:p-8">
      {/* Panneau clair : le texte reste lisible sur l'illustration de fond. */}
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-5xl font-bold tracking-tight text-amber-700">Chroni</h1>
        <p className="text-lg text-stone-700">
          Replacez des événements historiques et culturels dans le bon ordre chronologique.
        </p>
        <ul className="space-y-1 text-left text-stone-600">
          <li>• Une carte est déjà posée sur la frise, vous avez 10 cartes en main.</li>
          <li>• Choisissez une carte, puis son emplacement : la date n&apos;est révélée qu&apos;une fois la carte jouée.</li>
          <li>• Une erreur révèle la carte et vous en fait piocher une autre.</li>
          <li>• Vous gagnez quand votre main est vide.</li>
        </ul>
        {player === null ? (
          // Deux façons de jouer : en invité tout de suite, ou connecté pour des parties privées.
          <div className="flex w-full flex-col items-center gap-4">
            <StartButton label="Jouer en invité" />
            <p className="text-sm text-stone-600">
              Ou connectez-vous : vos parties seront privées.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-lg border border-amber-600 px-5 py-2 font-semibold text-amber-700 hover:bg-amber-50"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-amber-600 px-5 py-2 font-semibold text-amber-700 hover:bg-amber-50"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-3">
            <StartButton />
            <p className="text-sm text-stone-600">
              Connecté : <span className="font-medium break-all">{player.email}</span> · vos parties sont privées.
            </p>
            <div className="flex justify-center">
              <LogoutButton />
            </div>
          </div>
        )}
        <Link href="/credits" className="text-sm text-stone-500 underline hover:text-stone-700">
          Crédits des images
        </Link>
      </div>
    </main>
  );
}
