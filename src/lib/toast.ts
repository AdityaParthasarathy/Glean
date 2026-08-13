import { toast } from "sonner";

// Thin wrapper so every call site gets the same Glean-toned styling
// (a colored left border keyed to the app's own status tokens, not
// Sonner's stock red/green) without repeating the style object everywhere.
const baseStyle = {
  background: "var(--color-surface)",
  color: "var(--color-ink)",
  border: "1px solid var(--color-hairline-strong)",
};

export function notifyError(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  toast.error(message, {
    style: { ...baseStyle, borderLeft: "3px solid var(--color-status-unsafe)" },
  });
}

export function notifySuccess(message: string) {
  toast.success(message, {
    style: { ...baseStyle, borderLeft: "3px solid var(--color-accent)" },
  });
}
