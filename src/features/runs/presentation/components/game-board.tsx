"use client";

import Link from "next/link";
import { useMemo, useReducer } from "react";
import { createRunsApi } from "../api-client";
import {
  canPlay,
  cardCount,
  gameReducer,
  initialGameState,
  playSelectedCard,
  poolMessage,
} from "../game-state";
import type { RunResponse } from "../schemas";
import { CardView } from "./card-view";
import { Hand } from "./hand";
import { PlayFeedback } from "./play-feedback";
import { SidePanel } from "./side-panel";
import { StartButton } from "./start-button";
import { Timeline } from "./timeline";

export function GameBoard({ initialRun }: { initialRun: RunResponse }) {
  const api = useMemo(() => createRunsApi(), []);
  const [state, dispatch] = useReducer(gameReducer, initialRun, initialGameState);

  const { run } = state;
  const selected = run.hand.find((card) => card.id === state.selectedCardId);
  const won = run.status === "won";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:px-8">
      <h1 className="sr-only">Chroni</h1>
      <SidePanel>
        <p className="text-2xl font-bold">Chroni</p>
        {!won && <p className="text-sm font-medium">{poolMessage(run)}</p>}
        <dl className="flex flex-col gap-2 text-sm text-stone-700">
          <div className="flex justify-between gap-2">
            <dt>Frise chronologique</dt>
            <dd>{cardCount(run.timeline.length)}</dd>
          </div>
          {!won && (
            <div className="flex justify-between gap-2">
              <dt>Votre main</dt>
              <dd>{cardCount(run.hand.length)}</dd>
            </div>
          )}
          {run.discard.length > 0 && (
            <div className="flex justify-between gap-2">
              <dt>Cartes ratées</dt>
              <dd>{cardCount(run.discard.length)}</dd>
            </div>
          )}
        </dl>
        {selected !== undefined && (
          <p className="text-sm text-amber-800">Choisissez où placer « {selected.title} » sur la frise.</p>
        )}
        <Link href="/credits" className="mt-auto text-sm text-stone-500 underline hover:text-stone-700">
          Crédits des images
        </Link>
      </SidePanel>

      {won && (
        <section role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-800">Victoire !</h2>
          <p className="mt-1 text-stone-700">
            Frise complète : {run.timeline.length} cartes, dont {run.discard.length} ratée
            {run.discard.length > 1 ? "s" : ""}.
          </p>
          <div className="mt-4">
            <StartButton label="Rejouer" />
          </div>
        </section>
      )}

      {state.feedback !== null && (
        <PlayFeedback feedback={state.feedback} onDismiss={() => dispatch({ type: "dismissFeedback" })} />
      )}
      {state.error !== null && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          {state.error}
        </p>
      )}

      <Timeline
        cards={run.timeline}
        slotsEnabled={canPlay(state)}
        onPlace={(position) => void playSelectedCard(api, state, position, dispatch)}
      />

      {!won && (
        <Hand
          cards={run.hand}
          selectedCardId={state.selectedCardId}
          disabled={state.pending}
          onSelect={(cardId) => dispatch({ type: "select", cardId })}
        />
      )}

      {run.discard.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="Cartes ratées">
          {run.discard.map((card) => (
            <li key={card.id}>
              <CardView
                title={card.title}
                category={card.category}
                description={card.description}
                image={card.image}
                year={card.year}
                missed
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
