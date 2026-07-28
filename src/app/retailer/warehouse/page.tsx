"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api, type SessionInfo } from "@/lib/apiClient";
import type { FoodBatch } from "@/lib/types";
import { CATEGORY_LABELS, formatUsd } from "@/lib/format";
import FreshnessBadge from "@/components/FreshnessBadge";

const WarehouseScene = dynamic(() => import("@/components/warehouse/WarehouseScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      Loading warehouse…
    </div>
  ),
});

export default function WarehousePage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (retailerId: string) => {
    const b = await api.getBatches(retailerId);
    setBatches(b.filter((x) => x.status === "Listed"));
  }, []);

  useEffect(() => {
    api.getMe().then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session?.retailerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on session load
    refresh(session.retailerId);
  }, [session, refresh]);

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
    <div className="relative h-[calc(100vh-65px)] w-full bg-black">
      <WarehouseScene
        batches={batches}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id || null)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <Link
          href="/retailer"
          className="pointer-events-auto rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/90"
        >
          ← Back to dashboard
        </Link>
        <div className="pointer-events-auto rounded-xl border border-white/20 bg-black/70 px-3 py-2 text-[11px] text-zinc-300 backdrop-blur-sm">
          <p className="font-semibold text-white">Walk the aisle</p>
          <p>W/S or ↑/↓ — walk · A/D or ←/→ — look · click an item to inspect</p>
        </div>
      </div>

      {selected && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 w-full max-w-md -translate-x-1/2 rounded-xl border border-white/20 bg-zinc-950/90 p-5 text-white backdrop-blur-sm">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selected.itemName}</h3>
              <p className="text-xs text-zinc-400">
                {CATEGORY_LABELS[selected.category]} · {selected.quantity} {selected.unit}
              </p>
            </div>
            <FreshnessBadge score={selected.freshnessScore} isSafe={selected.isSafe} />
          </div>

          {selected.isSafe ? (
            <p className="mb-3 text-sm text-zinc-300">
              <span className="font-semibold text-emerald-400">
                {selected.suggestedMarkdownPct}% suggested markdown
              </span>{" "}
              → {formatUsd(selected.unitPrice * (1 - selected.suggestedMarkdownPct / 100))}/
              {selected.unit}
            </p>
          ) : (
            <p className="mb-3 text-sm text-red-400">
              Below the safety floor — compost only, not fit to ship.
            </p>
          )}

          <div className="flex items-center gap-2">
            {selected.isSafe && (
              <button
                onClick={handleSell}
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Ship out — sell to consumer
              </button>
            )}
            <button
              onClick={() => setSelectedId(null)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
