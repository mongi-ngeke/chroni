import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/app/container";
import { currentPlayer } from "@/app/current-player";
import { getRun } from "@/features/runs/application/get-run";
import { RunNotFoundError } from "@/features/runs/application/errors";
import type { RunResponse } from "@/features/runs/presentation/schemas";
import { GameBoard } from "@/features/runs/presentation/components/game-board";
import { toRunResponse } from "@/features/runs/presentation/mappers";

// L'état de la partie vient de la base : jamais pré-rendu.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partie en cours · Chroni" };

async function loadRun(id: string): Promise<RunResponse> {
  try {
    // La conversion en DTO masque les dates avant qu'elles ne quittent le serveur. La partie privée
    // d'un autre joueur est introuvable, comme une partie inexistante.
    const player = await currentPlayer();
    return toRunResponse(await getRun(container, id, player?.id ?? null));
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const run = await loadRun((await params).id);
  // `key` : une nouvelle partie remplace l'état du client au lieu de le conserver.
  return <GameBoard key={run.id} initialRun={run} />;
}
