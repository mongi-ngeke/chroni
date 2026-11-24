"use client";

import { useMemo, useReducer } from "react";
import { createRunsApi } from "../api-client";
import {
  canPlay,
  gameReducer,
  initialGameState,
  playSelectedCard,
  poolMessage,
} from "../game-state";
import type { RunResponse } from "../schemas";
import { CardView } from "./card-view";
import { Hand } from "./hand";
import { PlayFeedback } from "./play-feedback";
import { StartButton } from "./start-button";
import { Timeline } from "./timeline";

export function GameBoard({ initialRun }: { initialRun: RunResponse }) {
  const api = useMemo(() => createRunsApi(), []);
  const [state, dispatch] = useReducer(gameReducer, initialRun, initialGameState);

  const { run } = state;
  const selected = run.hand.find((card) => card.id === state.selectedCardId);
  const won = run.status === "won";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Chroni</h1>
        <p className="text-sm text-stone-600">{poolMessage(run)}</p>
      </header>

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

      <section aria-labelledby="timeline-title" className="flex flex-col gap-3">
        <h2 id="timeline-title" className="text-lg font-semibold">
          Frise chronologique
        </h2>
        {selected !== undefined && (
          <p className="text-sm text-amber-800">Choisissez où placer « {selected.title} » sur la frise.</p>
        )}
        <Timeline
          cards={run.timeline}
          slotsEnabled={canPlay(state)}
          onPlace={(position) => void playSelectedCard(api, state, position, dispatch)}
        />
      </section>

      {!won && (
        <section aria-labelledby="hand-title" className="flex flex-col gap-3">
          <h2 id="hand-title" className="text-lg font-semibold">
            Votre main ({run.hand.length})
          </h2>
          <Hand
            cards={run.hand}
            selectedCardId={state.selectedCardId}
            disabled={state.pending}
            onSelect={(cardId) => dispatch({ type: "select", cardId })}
          />
        </section>
      )}

      {run.discard.length > 0 && (
        <section aria-labelledby="discard-title" className="flex flex-col gap-3">
          <h2 id="discard-title" className="text-lg font-semibold">
            Cartes ratées ({run.discard.length})
          </h2>
          <ul className="flex flex-wrap gap-3">
            {run.discard.map((card) => (
              <li key={card.id}>
                <CardView title={card.title} category={card.category} year={card.year} missed />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
