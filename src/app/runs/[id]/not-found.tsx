import Link from "next/link";

export default function RunNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4 text-center sm:p-8">
      {/* Panneau clair : le texte reste lisible sur l'illustration de fond. */}
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <h1 className="text-3xl font-bold">Partie introuvable</h1>
        <p className="text-stone-700">Cette partie n&apos;existe pas ou n&apos;existe plus.</p>
        <Link href="/" className="rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-700">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
