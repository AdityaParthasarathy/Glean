"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import type { FoodBatch, Match, NGO, Retailer } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/format";
import FreshnessBadge from "@/components/FreshnessBadge";

interface EnrichedMatch extends Match {
  batch?: FoodBatch;
  ngo?: NGO;
}

export default function GleanOpsPage() {
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [b, r, n, m] = await Promise.all([
      api.getBatches(),
      api.getRetailers(),
      api.getNGOs(),
      api.getMatches(),
    ]);
    setBatches(b);
    setRetailers(r);
    setNgos(n);
    setMatches(m);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  function enrich(m: Match): EnrichedMatch {
    return {
      ...m,
      batch: batches.find((b) => b.id === m.batchId),
      ngo: ngos.find((n) => n.id === m.ngoId) ?? undefined,
    };
  }

  function retailerName(id: string) {
    return retailers.find((r) => r.id === id)?.name ?? "Unknown retailer";
  }

  async function handleDispatch(batchId: string) {
    setBusyId(batchId);
    try {
      const result = await api.findMatch(batchId);
      if ("candidate" in result && result.candidate === null) {
        setDispatchNotice((d) => ({ ...d, [batchId]: result.reason }));
      } else if ("ngo" in result) {
        setDispatchNotice((d) => ({
          ...d,
          [batchId]: `Proposed to ${result.ngo.name} (${result.distanceKm} km away)`,
        }));
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdvance(matchId: string, status: Match["status"]) {
    setBusyId(matchId);
    try {
      await api.advanceMatch(matchId, status);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const availableForTransfer = batches.filter(
    (b) => b.status === "Listed" && b.isSafe
  );
  const awaitingResponse = matches.filter((m) => m.status === "Matched").map(enrich);
  const arrangingPickup = matches.filter((m) => m.status === "Accepted").map(enrich);
  const inTransit = matches.filter((m) => m.status === "Picked up").map(enrich);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Glean dispatch console</h1>
        <p className="text-sm text-zinc-500">
          Glean is the middleman: retailers list stock, Glean matches it to an NGO and owns
          pickup and delivery once the NGO accepts.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <Section title="Available for transfer">
            {availableForTransfer.length === 0 ? (
              <Empty text="No unmatched inventory right now." />
            ) : (
              availableForTransfer.map((b) => (
                <MatchRow key={b.id}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{b.itemName}</p>
                      <p className="text-xs text-zinc-500">
                        {retailerName(b.retailerId)} · {b.quantity} {b.unit} ·{" "}
                        {CATEGORY_LABELS[b.category]}
                      </p>
                    </div>
                    <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
                  </div>
                  <div className="flex items-center gap-3">
                    {dispatchNotice[b.id] && (
                      <span className="text-xs text-zinc-500">{dispatchNotice[b.id]}</span>
                    )}
                    <button
                      onClick={() => handleDispatch(b.id)}
                      disabled={busyId === b.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Dispatch to NGO
                    </button>
                  </div>
                </MatchRow>
              ))
            )}
          </Section>

          <Section title="Awaiting NGO response">
            {awaitingResponse.length === 0 ? (
              <Empty text="Nothing pending an NGO decision." />
            ) : (
              awaitingResponse.map((m) => (
                <MatchRow key={m.id}>
                  <BatchInfo match={m} retailerName={retailerName} />
                  <span className="text-xs text-zinc-500">
                    Proposed to {m.ngo?.name ?? "NGO"}
                  </span>
                </MatchRow>
              ))
            )}
          </Section>

          <Section title="Accepted — arrange pickup">
            {arrangingPickup.length === 0 ? (
              <Empty text="Nothing accepted yet." />
            ) : (
              arrangingPickup.map((m) => (
                <MatchRow key={m.id}>
                  <BatchInfo match={m} retailerName={retailerName} />
                  <button
                    onClick={() => handleAdvance(m.id, "Picked up")}
                    disabled={busyId === m.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Mark picked up
                  </button>
                </MatchRow>
              ))
            )}
          </Section>

          <Section title="In transit — confirm delivery">
            {inTransit.length === 0 ? (
              <Empty text="Nothing in transit." />
            ) : (
              inTransit.map((m) => (
                <MatchRow key={m.id}>
                  <BatchInfo match={m} retailerName={retailerName} />
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
        </>
      )}
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

function BatchInfo({
  match,
  retailerName,
}: {
  match: EnrichedMatch;
  retailerName: (id: string) => string;
}) {
  const batch = match.batch;
  if (!batch) return <span className="text-sm text-zinc-500">Batch unavailable</span>;
  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="font-medium">{batch.itemName}</p>
        <p className="text-xs text-zinc-500">
          {retailerName(batch.retailerId)} → {match.ngo?.name ?? "NGO"} · {batch.quantity}{" "}
          {batch.unit} · {match.distanceKm} km
        </p>
      </div>
      <FreshnessBadge score={batch.freshnessScore} isSafe={batch.isSafe} />
    </div>
  );
}
