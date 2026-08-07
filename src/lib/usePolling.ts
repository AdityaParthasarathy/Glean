import { useEffect, useRef } from "react";

/**
 * Re-runs `callback` on a fixed interval so a page picks up changes made
 * from another session (e.g. a second laptop) without a manual reload.
 * Deliberately dumb polling, not websockets/SSE — the JSON-file store is
 * single-process and cheap to re-read, and polling is a lot less to get
 * wrong for a demo than a push channel.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
