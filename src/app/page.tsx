import { StartButton } from "@/features/runs/presentation/components/start-button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-8 p-8 text-center">
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
      <StartButton />
    </main>
  );
}
