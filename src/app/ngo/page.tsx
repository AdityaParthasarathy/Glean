"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Match, NGO } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/format";
import FreshnessBadge from "@/components/FreshnessBadge";
import StatusStepper from "@/components/StatusStepper";

interface EnrichedMatch extends Match {
  batch?: FoodBatch;
}

export default function NgoPage() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [ngoId, setNgoId] = useState("");
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<{
    acceptedCategories: FoodCategory[];
    minFreshness: number;
    capacityPerDay: number;
  } | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const ngo = ngos.find((n) => n.id === ngoId);

  const refresh = useCallback(async (id: string) => {
    const [allMatches, allBatches] = await Promise.all([
      api.getMatches(id),
      api.getBatches(),
    ]);
    const enriched = allMatches.map((m) => ({
      ...m,
      batch: allBatches.find((b) => b.id === m.batchId),
    }));
    setMatches(enriched);
  }, []);

  useEffect(() => {
    api.getNGOs().then((ns) => {
      setNgos(ns);
      if (ns.length > 0) setNgoId(ns[0].id);
    });
  }, []);

  useEffect(() => {
    if (!ngoId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on ngo switch
    refresh(ngoId);
    const n = ngos.find((x) => x.id === ngoId);
    if (n) {
      setPrefs({
        acceptedCategories: n.acceptedCategories,
        minFreshness: n.minFreshness,
        capacityPerDay: n.capacityPerDay,
      });
    }
  }, [ngoId, ngos, refresh]);

  async function handleAdvance(matchId: string, status: Match["status"]) {
    setBusyId(matchId);
    try {
      await api.advanceMatch(matchId, status);
      await refresh(ngoId);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSavePrefs() {
    if (!ngo || !prefs) return;
    setSavingPrefs(true);
    try {
      const updated = await api.updateNGO(ngo.id, prefs);
      setNgos((ns) => ns.map((n) => (n.id === updated.id ? updated : n)));
    } finally {
      setSavingPrefs(false);
    }
  }

  function toggleCategory(c: FoodCategory) {
    setPrefs((p) => {
      if (!p) return p;
      const has = p.acceptedCategories.includes(c);
      return {
        ...p,
        acceptedCategories: has
          ? p.acceptedCategories.filter((x) => x !== c)
          : [...p.acceptedCategories, c],
      };
    });
  }

  const incoming = matches.filter((m) => m.status === "Matched");
  const inProgress = matches.filter((m) => m.status === "Picked up");
  const delivered = matches.filter((m) => m.status === "Delivered");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NGO surplus feed</h1>
          <p className="text-sm text-zinc-500">
            You choose what to accept — set your own thresholds below. Demo data uses fictional
            NGO names.
          </p>
        </div>
        <select
          value={ngoId}
          onChange={(e) => setNgoId(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
        >
          {ngos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {prefs && (
        <div className="mb-10 rounded-xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-3 text-sm font-semibold">Acceptance preferences</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  prefs.acceptedCategories.includes(c)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-black/10 text-zinc-500 dark:border-white/10"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Minimum freshness
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={prefs.minFreshness}
                onChange={(e) =>
                  setPrefs((p) => (p ? { ...p, minFreshness: Number(e.target.value) } : p))
                }
                className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Daily capacity (units)
              </label>
              <input
                type="number"
                min={0}
                value={prefs.capacityPerDay}
                onChange={(e) =>
                  setPrefs((p) => (p ? { ...p, capacityPerDay: Number(e.target.value) } : p))
                }
                className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
              />
            </div>
            <button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}

      <Section title="Incoming matches — accept or decline">
        {incoming.length === 0 ? (
          <Empty text="No proposed matches right now." />
        ) : (
          incoming.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdvance(m.id, "Picked up")}
                  disabled={busyId === m.id}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAdvance(m.id, "Declined")}
                  disabled={busyId === m.id}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-zinc-900"
                >
                  Decline
                </button>
              </div>
            </MatchRow>
          ))
        )}
      </Section>

      <Section title="Picked up — mark delivered">
        {inProgress.length === 0 ? (
          <Empty text="Nothing in transit." />
        ) : (
          inProgress.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              <button
                onClick={() => handleAdvance(m.id, "Delivered")}
                disabled={busyId === m.id}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Mark delivered
              </button>
            </MatchRow>
          ))
        )}
      </Section>

      <Section title="Delivered">
        {delivered.length === 0 ? (
          <Empty text="No deliveries logged yet." />
        ) : (
          delivered.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              {m.batch && <StatusStepper status={m.batch.status} />}
            </MatchRow>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-zinc-500">{text}</p>;
}

function MatchRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
      {children}
    </div>
  );
}

function BatchInfo({ batch, distanceKm }: { batch?: FoodBatch; distanceKm: number }) {
  if (!batch) return <span className="text-sm text-zinc-500">Batch unavailable</span>;
  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="font-medium">{batch.itemName}</p>
        <p className="text-xs text-zinc-500">
          {batch.quantity} {batch.unit} · {CATEGORY_LABELS[batch.category]} · {distanceKm} km away
        </p>
      </div>
      <FreshnessBadge score={batch.freshnessScore} isSafe={batch.isSafe} />
    </div>
  );
}
