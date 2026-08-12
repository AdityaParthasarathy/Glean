import { useEffect, useRef, useState } from "react";

/**
 * Tracks how many *new* keys have appeared since the last poll while this
 * tab was hidden — a lightweight "you missed something" signal built
 * entirely from data the page already polls (no backend change, no push
 * channel). The first call just establishes a baseline; nothing counts as
 * "new" until a key that wasn't in that baseline shows up on a later poll.
 */
export function useUnseenActivity(keys: string[]) {
  const seenKeys = useRef<Set<string> | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const joinedKeys = keys.join(",");

  useEffect(() => {
    const currentKeys = joinedKeys ? joinedKeys.split(",") : [];
    if (seenKeys.current === null) {
      // State starts empty before the first fetch resolves, so the very
      // first effect run always sees `keys = []` — establishing the
      // baseline here would make every item in the first *real* fetch look
      // "new". Wait for actual data before locking in what counts as seen.
      if (currentKeys.length === 0) return;
      seenKeys.current = new Set(currentKeys);
      return;
    }
    const newKeys = currentKeys.filter((k) => !seenKeys.current!.has(k));
    if (newKeys.length === 0) return;
    for (const k of newKeys) seenKeys.current.add(k);
    if (document.hidden) {
      setUnseenCount((c) => c + newKeys.length);
    }
  }, [joinedKeys]);

  function dismiss() {
    setUnseenCount(0);
  }

  return { unseenCount, dismiss };
}
