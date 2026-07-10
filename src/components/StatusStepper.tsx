import type { BatchStatus } from "@/lib/types";

const STEPS: BatchStatus[] = ["Listed", "Matched", "Picked up", "Delivered"];

export default function StatusStepper({ status }: { status: BatchStatus }) {
  if (status === "Composted") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
        Below safety floor — composted, not redistributed
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[11px] whitespace-nowrap ${
                  done
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 mb-4 h-0.5 w-8 ${
                  i < currentIdx
                    ? "bg-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
