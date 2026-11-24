"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError, createRunsApi } from "../api-client";
import { errorMessage } from "../game-state";

export function StartButton({ label = "Nouvelle partie" }: { label?: string }) {
  const router = useRouter();
  const api = useMemo(() => createRunsApi(), []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const run = await api.startRun();
      router.push(`/runs/${run.id}`);
    } catch (caught) {
      setError(errorMessage(caught instanceof ApiError ? caught.code : "UNKNOWN"));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="rounded-lg bg-amber-600 px-6 py-3 text-lg font-semibold text-white shadow hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
      >
        {pending ? "Préparation du paquet…" : label}
      </button>
      {error !== null && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
