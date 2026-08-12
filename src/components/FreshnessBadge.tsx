import { freshnessTone, type FreshnessTone } from "@/lib/format";

const TONE_DOT: Record<FreshnessTone, string> = {
  fresh: "bg-status-fresh",
  mid: "bg-status-mid",
  low: "bg-status-low",
  unsafe: "bg-status-unsafe",
};

export default function FreshnessBadge({
  score,
  isSafe,
}: {
  score: number;
  isSafe: boolean;
}) {
  const tone = freshnessTone(score, isSafe);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
      {isSafe ? `${score}/100 fresh` : "Unsafe — compost"}
    </span>
  );
}
