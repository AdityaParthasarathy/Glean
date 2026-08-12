"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api, type SessionInfo } from "@/lib/apiClient";
import type { FoodBatch } from "@/lib/types";
import { CATEGORY_LABELS, formatUsd } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import FreshnessBadge from "@/components/FreshnessBadge";
import { Spotlight } from "@/components/core/spotlight";

const POLL_MS = 3000;

const WarehouseScene = dynamic(() => import("@/components/warehouse/WarehouseScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-faint">
      Loading store…
    </div>
  ),
});

export default function WarehousePage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (retailerId: string) => {
    const b = await api.getBatches(retailerId);
    setBatches(b.filter((x) => x.status === "Listed"));
    setLoaded(true);
  }, []);

  useEffect(() => {
    api.getMe().then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session?.retailerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on session load
    refresh(session.retailerId);
  }, [session, refresh]);

  // Shelves update live as items ship out or age past the safety floor —
  // from this laptop or another one.
  usePolling(
    () => {
      if (session?.retailerId) refresh(session.retailerId);
    },
    POLL_MS,
    !!session?.retailerId
  );

  const selected = batches.find((b) => b.id === selectedId) ?? null;

  async function handleSell() {
    if (!selected || !session?.retailerId) return;
    setBusy(true);
    try {
      await api.sellBatch(selected.id);
      setSelectedId(null);
      await refresh(session.retailerId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative h-[calc(100vh-65px)] w-full bg-bg">
      <WarehouseScene
        batches={batches}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id || null)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <Link
          href="/retailer"
          className="pointer-events-auto rounded-full border border-hairline-strong bg-bg/85 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur-sm hover:border-accent hover:text-accent"
        >
          ← Back to dashboard
        </Link>
        <div className="pointer-events-auto rounded-xl border border-hairline-strong bg-bg/85 px-3 py-2 text-[11px] text-ink-soft backdrop-blur-sm">
          <p className="font-semibold text-ink">Walk the store</p>
          <p>W/S or ↑/↓ — walk · A/D or ←/→ — turn · click an item to inspect</p>
        </div>
      </div>

      {loaded && batches.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="pointer-events-auto max-w-sm rounded-xl border border-hairline-strong bg-bg/95 p-5 text-center text-ink backdrop-blur-sm">
            <p className="font-semibold">Nothing on the shelves right now</p>
            <p className="mt-1 text-sm text-ink-soft">
              Every listed item has either shipped out or aged past the safety floor. Add new
              inventory from the retailer dashboard, or run <code>npm run seed</code> to reset
              the demo data.
            </p>
          </div>
        </div>
      )}

      {selected && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 rounded-xl bg-hairline-strong/40 p-[1px]">
          <Spotlight
            className={
              selected.isSafe
                ? "from-accent via-accent to-accent-soft blur-2xl"
                : "from-status-unsafe via-status-unsafe to-status-low blur-2xl"
            }
            size={180}
          />
          <div className="relative rounded-[11px] bg-surface/95 p-5 text-ink backdrop-blur-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{selected.itemName}</h3>
                <p className="text-xs text-ink-faint">
                  {CATEGORY_LABELS[selected.category]} · {selected.quantity} {selected.unit}
                </p>
              </div>
              <FreshnessBadge score={selected.freshnessScore} isSafe={selected.isSafe} />
            </div>

            {selected.isSafe ? (
              <p className="mb-3 text-sm text-ink-soft">
                <span className="font-semibold text-accent">
                  {selected.suggestedMarkdownPct}% suggested markdown
                </span>{" "}
                → {formatUsd(selected.unitPrice * (1 - selected.suggestedMarkdownPct / 100))}/
                {selected.unit}
              </p>
            ) : (
              <p className="mb-3 text-sm text-status-unsafe">
                Below the safety floor — compost only, not fit to ship.
              </p>
            )}

            <div className="flex items-center gap-2">
              {selected.isSafe && (
                <button
                  onClick={handleSell}
                  disabled={busy}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Ship out — sell to consumer
                </button>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg border border-hairline-strong px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
