import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/app/current-player";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";

// Dépend du cookie de session : jamais pré-rendue.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion · Chroni" };

export default async function LoginPage() {
  // Déjà connecté : rien à faire ici.
  if ((await currentPlayer()) !== null) {
    redirect("/");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4 sm:p-8">
      {/* Panneau clair : le texte reste lisible sur l'illustration de fond. */}
      <div className="w-full rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
