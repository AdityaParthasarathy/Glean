import { freshnessTone } from "@/lib/format";

const TONE_CLASSES: Record<string, string> = {
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {isSafe ? `${score}/100 fresh` : "Unsafe — compost"}
    </span>
  );
}
