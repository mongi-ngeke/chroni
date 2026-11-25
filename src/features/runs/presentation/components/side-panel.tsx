"use client";

import { useEffect, useState, type ReactNode } from "react";

const PANEL_ID = "side-panel";

/**
 * Volet gauche ouvert par un bouton burger : il regroupe les textes de la partie pour laisser
 * toute la hauteur de l'écran à la frise et à la main. Fermé, il est `inert` (ni focus, ni
 * lecteur d'écran) ; Échap ou un clic à côté le referment.
 */
export function SidePanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-30 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg bg-white/90 shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <span className="h-0.5 w-5 rounded bg-stone-800" />
        <span className="h-0.5 w-5 rounded bg-stone-800" />
        <span className="h-0.5 w-5 rounded bg-stone-800" />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-stone-900/30"
        />
      )}

      <aside
        id={PANEL_ID}
        aria-label="Menu de la partie"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-white/95 p-5 shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="self-end rounded px-2 text-2xl leading-none text-stone-500 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          ×
        </button>
        {children}
      </aside>
    </>
  );
}
