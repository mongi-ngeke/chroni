import type { CardCredit } from "../application/list-card-credits";

export function CreditsList({ credits }: { credits: readonly CardCredit[] }) {
  if (credits.length === 0) {
    return <p className="text-stone-600">Aucune carte pour le moment.</p>;
  }
  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {credits.map((item) => (
        <li key={item.cardId} className="flex flex-col gap-0.5 p-3 sm:flex-row sm:justify-between sm:gap-6">
          <span className="font-medium">{item.title}</span>
          <span className="text-sm text-stone-600">{item.credit}</span>
        </li>
      ))}
    </ul>
  );
}
