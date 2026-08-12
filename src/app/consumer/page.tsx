"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Tag, SearchX } from "lucide-react";
import { api } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Retailer } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS, formatUsd } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import FreshnessBadge from "@/components/FreshnessBadge";
import { AnimatedGroup } from "@/components/core/animated-group";
import PageHeaderAccent from "@/components/PageHeaderAccent";
import BatchThumb from "@/components/BatchThumb";

const POLL_MS = 3000;

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

  usePolling(refresh, POLL_MS);

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
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-10">
        <PageHeaderAccent className="mb-4" />
        <h1 className="font-serif text-3xl tracking-tight text-ink">Deals near you</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Surplus from local retailers at a discount before it expires.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as FoodCategory | "all")}
          className="rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
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
          className="rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline-strong py-16 text-center">
          <SearchX className="h-6 w-6 text-ink-faint" />
          <p className="text-sm text-ink-faint">No deals match those filters right now.</p>
        </div>
      ) : (
        <AnimatedGroup
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          preset="blur-slide"
        >
          {deals.map((b) => {
            const retailer = retailers.find((r) => r.id === b.retailerId);
            const price = b.unitPrice * (1 - b.suggestedMarkdownPct / 100);
            return (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <BatchThumb photoUrl={b.photoUrl} category={b.category} size="h-32 w-full" />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg text-ink">{b.itemName}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {retailer?.name} · {retailer?.location}
                    </p>
                  </div>
                  <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-medium text-accent">{formatUsd(price)}</span>
                  <span className="text-xs text-ink-faint line-through">
                    {formatUsd(b.unitPrice)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-clay">
                    <Tag className="h-3 w-3" />
                    {b.suggestedMarkdownPct}% off
                  </span>
                </div>
                <p className="text-xs text-ink-faint">
                  {b.quantity} {b.unit} available · {CATEGORY_LABELS[b.category]}
                </p>
                <button
                  onClick={() => handleClaim(b.id)}
                  disabled={busyId === b.id}
                  className="mt-auto rounded-full bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {claimedId === b.id ? "Claimed!" : "Claim deal"}
                </button>
              </div>
            );
          })}
        </AnimatedGroup>
      )}
    </div>
  );
}
