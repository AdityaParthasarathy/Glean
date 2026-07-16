"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type SessionInfo } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Match, NGO } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS, formatUsd } from "@/lib/format";
import FreshnessBadge from "@/components/FreshnessBadge";
import StatusStepper from "@/components/StatusStepper";

const EXPIRY_CATEGORIES: FoodCategory[] = ["dairy", "packaged", "frozen"];

export default function RetailerPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "produce" as FoodCategory,
    itemName: "",
    quantity: "10",
    unit: "units",
    unitPrice: "3.00",
    expiryDate: "",
  });

  const refresh = useCallback(async (rid: string) => {
    const [b, n, m] = await Promise.all([
      api.getBatches(rid),
      api.getNGOs(),
      api.getMatches(),
    ]);
    setBatches(b);
    setNgos(n);
    setMatches(m);
  }, []);

  useEffect(() => {
    api.getMe().then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session?.retailerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on session load
    setLoading(true);
    refresh(session.retailerId).finally(() => setLoading(false));
  }, [session, refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.retailerId) return;
    await api.createBatch({
      category: form.category,
      itemName: form.itemName || `${CATEGORY_LABELS[form.category]} batch`,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
    });
    setForm((f) => ({ ...f, itemName: "" }));
    refresh(session.retailerId);
  }

  async function handleSell(batchId: string) {
    if (!session?.retailerId) return;
    setBusyId(batchId);
    try {
      await api.sellBatch(batchId);
      await refresh(session.retailerId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Retailer dashboard</h1>
        <p className="text-sm text-zinc-500">
          {session ? `Logged in as ${session.displayName}. ` : ""}List inventory and see
          freshness scores and suggested markdowns. Listed items are automatically visible to
          Glean for NGO matching — you can also sell directly to consumers.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="mb-10 grid grid-cols-2 gap-4 rounded-xl border border-black/10 p-5 dark:border-white/10 sm:grid-cols-6"
      >
        <div className="col-span-2 sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500">Item name</label>
          <input
            value={form.itemName}
            onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
            placeholder="e.g. Bananas"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value as FoodCategory }))
            }
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Quantity</label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Unit price</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
          />
        </div>
        {EXPIRY_CATEGORIES.includes(form.category) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Expiry date
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            />
          </div>
        )}
        <div className="col-span-2 flex items-end sm:col-span-1">
          <button
            type="submit"
            disabled={!session?.retailerId}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            Add to inventory
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading inventory…</p>
      ) : batches.length === 0 ? (
        <p className="text-sm text-zinc-500">No inventory listed yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold">{b.itemName}</h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {CATEGORY_LABELS[b.category]}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {b.quantity} {b.unit} · {formatUsd(b.unitPrice)}/{b.unit} listed price
                  </p>
                </div>
                <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <StatusStepper status={b.status} />
                {b.isSafe && (
                  <div className="text-sm">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {b.suggestedMarkdownPct}% suggested markdown
                    </span>
                    <span className="ml-2 text-zinc-500">
                      → {formatUsd(b.unitPrice * (1 - b.suggestedMarkdownPct / 100))}/
                      {b.unit}
                    </span>
                  </div>
                )}
              </div>

              {b.status === "Listed" && b.isSafe && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    Available for transfer — Glean will route this to an NGO or you can sell it
                    directly.
                  </span>
                  <button
                    onClick={() => handleSell(b.id)}
                    disabled={busyId === b.id}
                    className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-zinc-900"
                  >
                    Mark sold to consumer
                  </button>
                </div>
              )}

              {b.status !== "Listed" && b.status !== "Composted" && (
                <p className="mt-3 text-xs text-zinc-500">
                  {(() => {
                    const match = matches.find(
                      (m) => m.batchId === b.id && m.status !== "Declined"
                    );
                    const ngoName =
                      ngos.find((n) => n.id === match?.ngoId)?.name ?? "matched NGO";
                    const STATUS_LABEL: Record<string, string> = {
                      Matched: `Proposed to ${ngoName} — awaiting their response.`,
                      Accepted: `Accepted by ${ngoName} — awaiting pickup by Glean.`,
                      "Picked up": `Picked up by Glean, in transit to ${ngoName}.`,
                      Delivered: `Delivered to ${ngoName}.`,
                    };
                    return match ? STATUS_LABEL[match.status] : null;
                  })()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
