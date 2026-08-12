import type { BatchStatus } from "@/lib/types";

const STEPS: BatchStatus[] = ["Listed", "Matched", "Picked up", "Delivered"];

export default function StatusStepper({ status }: { status: BatchStatus }) {
  if (status === "Composted") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-status-unsafe">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-unsafe" />
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
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                  done
                    ? "bg-accent text-bg"
                    : "border border-hairline-strong text-ink-faint"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[11px] whitespace-nowrap ${
                  done ? "text-ink" : "text-ink-faint"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1.5 mb-4 h-px w-8 ${i < currentIdx ? "bg-accent" : "bg-hairline"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
