import { describeFeedback, type Feedback } from "../game-state";

export function PlayFeedback({ feedback, onDismiss }: { feedback: Feedback; onDismiss(): void }) {
  const style =
    feedback.outcome === "correct"
      ? "border-green-300 bg-green-50 text-green-900"
      : "border-red-300 bg-red-50 text-red-900";
  return (
    <div role="status" className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${style}`}>
      <p>{describeFeedback(feedback)}</p>
      <button type="button" onClick={onDismiss} className="text-sm underline" aria-label="Fermer le message">
        Fermer
      </button>
    </div>
  );
}
