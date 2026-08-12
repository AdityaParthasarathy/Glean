import { cn } from "@/lib/utils";

// A small static gradient mark echoing the home hero's Velaris palette
// (accent → clay). Gives every dashboard page the same visual signature as
// the hero without repeating an animated background on data-dense screens.
export default function PageHeaderAccent({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-[3px] w-12 rounded-full bg-gradient-to-r from-accent to-clay", className)}
    />
  );
}
