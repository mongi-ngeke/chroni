import { formatYear } from "../game-state";

const CATEGORY_LABELS: Record<string, string> = {
  historical: "Histoire",
  cultural: "Culture",
};

export interface CardViewProps {
  title: string;
  category?: string | undefined;
  /** Absent pour une carte masquée : la date n'existe pas côté client avant révélation. */
  year?: number | undefined;
  selected?: boolean;
  /** Carte révélée par une erreur de placement. */
  missed?: boolean;
}

export function CardView({ title, category, year, selected = false, missed = false }: CardViewProps) {
  const border = selected ? "border-amber-500 ring-2 ring-amber-400" : missed ? "border-red-300" : "border-stone-300";
  return (
    <div
      className={`flex h-36 w-40 shrink-0 flex-col justify-between rounded-lg border bg-white p-3 text-left shadow-sm ${border}`}
    >
      <div>
        {category !== undefined && (
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-stone-500">
            {CATEGORY_LABELS[category] ?? category}
          </p>
        )}
        <p className="text-sm font-medium leading-snug">{title}</p>
      </div>
      {year === undefined ? (
        <p className="text-xl font-bold text-stone-300" aria-label="Date cachée">
          ????
        </p>
      ) : (
        <p className={`text-xl font-bold ${missed ? "text-red-700" : "text-amber-700"}`}>{formatYear(year)}</p>
      )}
    </div>
  );
}
