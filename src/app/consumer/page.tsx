"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Retailer } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS, formatUsd } from "@/lib/format";
import FreshnessBadge from "@/components/FreshnessBadge";

export default function ConsumerPage() {
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "all">("all");
  const [retailerFilter, setRetailerFilter] = useState<string>("all");
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [b, r] = await Promise.all([api.getBatches(), api.getRetailers()]);
    setBatches(b);
    setRetailers(r);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  async function handleClaim(id: string) {
    setBusyId(id);
    try {
      await api.sellBatch(id);
      setClaimedId(id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const deals = batches.filter(
    (b) =>
      b.status === "Listed" &&
      b.isSafe &&
      (categoryFilter === "all" || b.category === categoryFilter) &&
      (retailerFilter === "all" || b.retailerId === retailerFilter)
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Markdown deals near you</h1>
        <p className="text-sm text-zinc-500">
          Surplus from local retailers at a discount before it expires.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FoodCategory | "all")}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={retailerFilter}
          onChange={(e) => setRetailerFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
        >
          <option value="all">All locations</option>
          {retailers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.location}
            </option>
          ))}
        </select>
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-zinc-500">No deals match those filters right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((b) => {
            const retailer = retailers.find((r) => r.id === b.retailerId);
            const price = b.unitPrice * (1 - b.suggestedMarkdownPct / 100);
            return (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.itemName}</h3>
                    <p className="text-xs text-zinc-500">
                      {retailer?.name} · {retailer?.location}
                    </p>
                  </div>
                  <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatUsd(price)}
                  </span>
                  <span className="text-xs text-zinc-400 line-through">
                    {formatUsd(b.unitPrice)}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {b.suggestedMarkdownPct}% off
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {b.quantity} {b.unit} available · {CATEGORY_LABELS[b.category]}
                </p>
                <button
                  onClick={() => handleClaim(b.id)}
                  disabled={busyId === b.id}
                  className="mt-auto rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {claimedId === b.id ? "Claimed!" : "Claim deal"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
