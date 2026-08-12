export default function ActivityBadge({
  count,
  onDismiss,
}: {
  count: number;
  onDismiss: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      onClick={onDismiss}
      className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-medium text-accent-soft-text transition-opacity hover:opacity-80"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      {count} update{count === 1 ? "" : "s"} while you were away — tap to dismiss
    </button>
  );
}
