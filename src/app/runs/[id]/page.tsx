import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/app/container";
import { currentPlayer } from "@/app/current-player";
import { AccountPanel } from "@/features/auth/presentation/components/account-panel";
import { getRun } from "@/features/runs/application/get-run";
import { RunNotFoundError } from "@/features/runs/application/errors";
import type { RunResponse } from "@/features/runs/presentation/schemas";
import { GameBoard } from "@/features/runs/presentation/components/game-board";
import { toRunResponse } from "@/features/runs/presentation/mappers";

// L'état de la partie vient de la base : jamais pré-rendu.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partie en cours · Chroni" };

async function loadRun(id: string, playerId: string | null): Promise<RunResponse> {
  try {
    // La conversion en DTO masque les dates avant qu'elles ne quittent le serveur. La partie privée
    // d'un autre joueur est introuvable, comme une partie inexistante.
    return toRunResponse(await getRun(container, id, playerId));
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const player = await currentPlayer();
  const run = await loadRun((await params).id, player?.id ?? null);
  // `key` : une nouvelle partie remplace l'état du client au lieu de le conserver.
  return <GameBoard key={run.id} initialRun={run} account={<AccountPanel email={player?.email ?? null} />} />;
}
