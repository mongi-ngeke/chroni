import Image from "next/image";
import { formatYear } from "../game-state";

const CATEGORY_LABELS: Record<string, string> = {
  historical: "Histoire",
  cultural: "Culture",
};

export interface CardViewProps {
  title: string;
  category?: string | undefined;
  description: string;
  image: { url: string; alt: string };
  /** Absent pour une carte masquée : la date n'existe pas côté client avant révélation. */
  year?: number | undefined;
  selected?: boolean;
  /** Carte révélée par une erreur de placement. */
  missed?: boolean;
}

export function CardView({ title, category, description, image, year, selected = false, missed = false }: CardViewProps) {
  const border = selected ? "border-amber-500 ring-2 ring-amber-400" : missed ? "border-red-300" : "border-stone-300";
  return (
    <div className={`flex w-64 shrink-0 flex-col overflow-hidden rounded-lg border bg-white text-left shadow-sm ${border}`}>
      <div className="relative h-44 w-full bg-stone-100">
        {/* `unoptimized` : le navigateur charge directement la miniature Wikimedia (déjà dimensionnée).
            L'optimiseur de Next la téléchargerait côté serveur, depuis une seule IP, et Wikimedia
            répond 429 dès qu'une main de 10 cartes est demandée d'un coup. */}
        <Image src={image.url} alt={image.alt} fill sizes="256px" unoptimized className="object-cover object-top" />
        {/* Titre et catégorie sur l'image : le dégradé sombre les garde lisibles sur toute photo. */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/45 to-transparent px-3 pt-2.5 pb-8 text-white">
          {category !== undefined && (
            <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white/80">
              {CATEGORY_LABELS[category] ?? category}
            </p>
          )}
          <p className="text-sm font-semibold leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">{title}</p>
        </div>
        {year !== undefined && (
          <p
            className={`absolute right-2 bottom-2 rounded-md px-2 py-0.5 text-lg font-bold text-white shadow ${missed ? "bg-red-700" : "bg-amber-700"}`}
          >
            {formatYear(year)}
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs leading-relaxed text-stone-600">{description}</p>
      </div>
    </div>
  );
}
