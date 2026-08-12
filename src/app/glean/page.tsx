"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import type { FoodBatch, Match, NGO, Retailer } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import { useUnseenActivity } from "@/lib/useUnseenActivity";
import { remainingCapacity } from "@/lib/engines/matching";
import FreshnessBadge from "@/components/FreshnessBadge";
import PageHeaderAccent from "@/components/PageHeaderAccent";
import BatchThumb from "@/components/BatchThumb";
import ActivityBadge from "@/components/ActivityBadge";
import {
  Disclosure,
  DisclosureTrigger,
  DisclosureContent,
} from "@/components/core/disclosure";

const POLL_MS = 3000;

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const { unseenCount, dismiss: dismissActivity } = useUnseenActivity(
    matches.map((m) => `${m.id}:${m.status}`)
  );

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

  // Picks up new listings from retailers and new NGO decisions without a
  // manual reload.
  usePolling(refresh, POLL_MS);

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
          [batchId]: `Proposed to ${result.ngo.name} (${result.distanceKm} km away · ${result.remainingCapacity}/${result.ngo.capacityPerDay} capacity left today)`,
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
  // Delivered/Declined matches otherwise vanish from this console entirely
  // once they leave the active pipeline — this is the only place to see them.
  const history = matches
    .filter((m) => m.status === "Delivered" || m.status === "Declined")
    .map(enrich)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-12">
        <PageHeaderAccent className="mb-4" />
        <h1 className="font-serif text-3xl tracking-tight text-ink">Dispatch</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Glean is the middleman: retailers list stock, Glean matches it to an NGO and owns
          pickup and delivery once the NGO accepts.
        </p>
      </div>

      <ActivityBadge count={unseenCount} onDismiss={dismissActivity} />

      {loading ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <>
          <Section title="Available for transfer">
            {availableForTransfer.length === 0 ? (
              <Empty text="No unmatched inventory right now." />
            ) : (
              availableForTransfer.map((b) => (
                <MatchRow key={b.id}>
                  <div className="flex items-center gap-3">
                    <BatchThumb photoUrl={b.photoUrl} category={b.category} size="h-10 w-10" />
                    <div>
                      <p className="font-medium text-ink">{b.itemName}</p>
                      <p className="text-xs text-ink-faint">
                        {retailerName(b.retailerId)} · {b.quantity} {b.unit} ·{" "}
                        {CATEGORY_LABELS[b.category]}
                      </p>
                    </div>
                    <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
                  </div>
                  <div className="flex items-center gap-3">
                    {dispatchNotice[b.id] && (
                      <span className="text-xs text-ink-faint">{dispatchNotice[b.id]}</span>
                    )}
                    <button
                      onClick={() => handleDispatch(b.id)}
                      disabled={busyId === b.id}
                      className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
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
                  <span className="text-xs text-ink-faint">
                    Proposed to {m.ngo?.name ?? "NGO"}
                    {m.ngo && (
                      <> · {remainingCapacity(m.ngo, matches, batches)}/{m.ngo.capacityPerDay} capacity left today</>
                    )}
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
                    className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
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
                    className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    Mark delivered
                  </button>
                </MatchRow>
              ))
            )}
          </Section>

          <Disclosure
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          >
            <DisclosureTrigger>
              <button
                type="button"
                className="flex w-full items-center justify-between border-t border-hairline py-3 text-left"
              >
                <span className="text-xs font-medium text-ink-faint">
                  History — delivered &amp; declined ({history.length})
                </span>
                <span
                  className={`text-ink-faint transition-transform ${historyOpen ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
            </DisclosureTrigger>
            <DisclosureContent>
              <div className="pb-2">
                {history.length === 0 ? (
                  <Empty text="Nothing delivered or declined yet." />
                ) : (
                  history.map((m) => (
                    <MatchRow key={m.id}>
                      <BatchInfo match={m} retailerName={retailerName} />
                      <span
                        className={`text-xs font-medium ${
                          m.status === "Declined" ? "text-status-unsafe" : "text-accent"
                        }`}
                      >
                        {m.status === "Declined"
                          ? `Declined by ${m.ngo?.name ?? "NGO"}`
                          : `Delivered to ${m.ngo?.name ?? "NGO"}`}
                      </span>
                    </MatchRow>
                  ))
                )}
              </div>
            </DisclosureContent>
          </Disclosure>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xs font-medium text-ink-faint">{title}</h2>
      <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-4 text-sm text-ink-faint">{text}</p>;
}

function MatchRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
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
  if (!batch) return <span className="text-sm text-ink-faint">Batch unavailable</span>;
  return (
    <div className="flex items-center gap-3">
      <BatchThumb photoUrl={batch.photoUrl} category={batch.category} size="h-10 w-10" />
      <div>
        <p className="font-medium text-ink">{batch.itemName}</p>
        <p className="text-xs text-ink-faint">
          {retailerName(batch.retailerId)} → {match.ngo?.name ?? "NGO"} · {batch.quantity}{" "}
          {batch.unit} · {match.distanceKm} km
        </p>
      </div>
      <FreshnessBadge score={batch.freshnessScore} isSafe={batch.isSafe} />
    </div>
  );
}
