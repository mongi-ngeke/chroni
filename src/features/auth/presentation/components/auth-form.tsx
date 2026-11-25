"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ApiError, createAuthApi } from "../api-client";
import { authErrorMessage, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../messages";

export type AuthMode = "login" | "signup";

const COPY: Record<AuthMode, { title: string; submit: string; pending: string; other: string; otherHref: string }> = {
  login: {
    title: "Connexion",
    submit: "Se connecter",
    pending: "Connexion…",
    other: "Pas encore de compte ? Créer un compte",
    otherHref: "/signup",
  },
  signup: {
    title: "Créer un compte",
    submit: "Créer mon compte",
    pending: "Création…",
    other: "Déjà un compte ? Se connecter",
    otherHref: "/login",
  },
};

/** Formulaire de connexion ou d'inscription. En cas de succès, retour à l'accueil, connecté. */
export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const api = useMemo(() => createAuthApi(), []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
    setPending(true);
    setError(null);
    try {
      await (mode === "signup" ? api.signUp(credentials) : api.logIn(credentials));
      router.push("/");
      // Les pages serveur relisent le cookie : l'accueil s'affiche connecté.
      router.refresh();
    } catch (caught) {
      setError(authErrorMessage(caught instanceof ApiError ? caught.code : "UNKNOWN"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4 text-left" aria-labelledby="auth-title">
      <h1 id="auth-title" className="text-center text-3xl font-bold text-amber-700">
        {copy.title}
      </h1>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-base font-normal text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          aria-describedby={mode === "signup" ? "password-rule" : undefined}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-base font-normal text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {mode === "signup" && (
          <span id="password-rule" className="text-xs font-normal text-stone-500">
            Au moins {PASSWORD_MIN_LENGTH} caractères.
          </span>
        )}
      </label>
      {error !== null && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-600 px-6 py-3 text-lg font-semibold text-white shadow transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? copy.pending : copy.submit}
      </button>
      <p className="flex flex-col items-center gap-1 text-center text-sm text-stone-600">
        <Link href={copy.otherHref} className="underline hover:text-stone-900">
          {copy.other}
        </Link>
        <Link href="/" className="underline hover:text-stone-900">
          Retour à l&apos;accueil
        </Link>
      </p>
    </form>
  );
}
