import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/app/container";
import { listCardCredits } from "@/features/cards/application/list-card-credits";
import { CreditsList } from "@/features/cards/presentation/credits-list";

// Les crédits viennent de la base : jamais pré-rendus.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crédits des images · Chroni" };

export default async function CreditsPage() {
  const credits = await listCardCredits(container);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-col gap-2 rounded-lg bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <Link href="/" className="text-sm text-amber-700 underline">
          ← Retour à l&apos;accueil
        </Link>
        <h1 className="text-2xl font-bold">Crédits des images</h1>
        <p className="text-stone-600">
          Les images des cartes viennent de Wikimedia Commons. Voici leurs auteurs et leurs licences, par ordre
          alphabétique des cartes.
        </p>
      </header>
      <CreditsList credits={credits} />
    </main>
  );
}
