"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type SessionInfo } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Match, NGO } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import { useUnseenActivity } from "@/lib/useUnseenActivity";
import { notifyError, notifySuccess } from "@/lib/toast";
import FreshnessBadge from "@/components/FreshnessBadge";
import StatusStepper from "@/components/StatusStepper";
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
}

export default function NgoPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(true);
  const [prefs, setPrefs] = useState<{
    acceptedCategories: FoodCategory[];
    minFreshness: number;
    capacityPerDay: number;
  } | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [declinedOpen, setDeclinedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { unseenCount, dismiss: dismissActivity } = useUnseenActivity(
    matches.map((m) => `${m.id}:${m.status}`)
  );

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
    api.getMe().then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session?.ngoId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on session load
    setLoading(true);
    Promise.all([
      refresh(session.ngoId),
      api.getNGO(session.ngoId).then((n) => {
        setNgo(n);
        setPrefs({
          acceptedCategories: n.acceptedCategories,
          minFreshness: n.minFreshness,
          capacityPerDay: n.capacityPerDay,
        });
      }),
    ]).finally(() => setLoading(false));
  }, [session, refresh]);

  // Picks up new dispatches from Glean (e.g. a second laptop) without a
  // manual reload. Only re-fetches matches, not preferences, so it never
  // clobbers an in-progress edit to the acceptance-rules form below.
  usePolling(
    () => {
      if (session?.ngoId) refresh(session.ngoId);
    },
    POLL_MS,
    !!session?.ngoId
  );

  async function handleAdvance(matchId: string, status: Match["status"]) {
    if (!session?.ngoId) return;
    setBusyId(matchId);
    try {
      await api.advanceMatch(matchId, status);
      await refresh(session.ngoId);
    } catch (err) {
      notifyError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSavePrefs() {
    if (!ngo || !prefs) return;
    setSavingPrefs(true);
    try {
      const updated = await api.updateNGO(ngo.id, prefs);
      setNgo(updated);
      notifySuccess("Preferences saved");
    } catch (err) {
      notifyError(err);
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
  const accepted = matches.filter((m) => m.status === "Accepted");
  const inTransit = matches.filter((m) => m.status === "Picked up");
  const delivered = matches.filter((m) => m.status === "Delivered");
  // Matches this NGO itself declined otherwise leave no record anywhere in
  // its own feed once acted on.
  const declined = matches.filter((m) => m.status === "Declined");

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-10">
        <PageHeaderAccent className="mb-4" />
        <h1 className="font-serif text-3xl tracking-tight text-ink">Surplus feed</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          {ngo ? `Logged in as ${ngo.name}. ` : ""}You choose what to accept — set your own
          thresholds below. Glean handles pickup and delivery once you accept.
        </p>
      </div>

      <ActivityBadge count={unseenCount} onDismiss={dismissActivity} />

      {prefs && (
        <Disclosure
          open={prefsOpen}
          onOpenChange={setPrefsOpen}
          className="mb-12 rounded-2xl border border-hairline bg-surface shadow-sm"
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        >
          <DisclosureTrigger>
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-xs font-medium text-ink-faint">
                Acceptance preferences
              </span>
              <span
                className={`text-ink-faint transition-transform ${prefsOpen ? "rotate-45" : ""}`}
              >
                +
              </span>
            </button>
          </DisclosureTrigger>
          <DisclosureContent>
            <div className="px-6 pb-6">
              <div className="mb-5 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      prefs.acceptedCategories.includes(c)
                        ? "border-accent bg-accent-soft text-accent-soft-text"
                        : "border-hairline-strong text-ink-faint"
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-5">
                <label className="block">
                  <span className="text-xs font-medium text-ink-faint">
                    Min. freshness
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={prefs.minFreshness}
                    onChange={(e) =>
                      setPrefs((p) => (p ? { ...p, minFreshness: Number(e.target.value) } : p))
                    }
                    className="mt-1.5 w-28 rounded-lg border border-hairline-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-faint">
                    Daily capacity
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={prefs.capacityPerDay}
                    onChange={(e) =>
                      setPrefs((p) => (p ? { ...p, capacityPerDay: Number(e.target.value) } : p))
                    }
                    className="mt-1.5 w-28 rounded-lg border border-hairline-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <button
                  onClick={handleSavePrefs}
                  disabled={savingPrefs}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Save preferences
                </button>
              </div>
            </div>
          </DisclosureContent>
        </Disclosure>
      )}

      {loading ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <>
      <Section title="Incoming matches — accept or decline">
        {incoming.length === 0 ? (
          <Empty text="No proposed matches right now." />
        ) : (
          incoming.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdvance(m.id, "Accepted")}
                  disabled={busyId === m.id}
                  className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAdvance(m.id, "Declined")}
                  disabled={busyId === m.id}
                  className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-status-unsafe hover:text-status-unsafe disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </MatchRow>
          ))
        )}
      </Section>

      <Section title="Accepted — awaiting pickup by Glean">
        {accepted.length === 0 ? (
          <Empty text="Nothing accepted yet." />
        ) : (
          accepted.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              <span className="text-xs text-ink-faint">Glean will arrange pickup</span>
            </MatchRow>
          ))
        )}
      </Section>

      <Section title="In transit">
        {inTransit.length === 0 ? (
          <Empty text="Nothing in transit." />
        ) : (
          inTransit.map((m) => (
            <MatchRow key={m.id}>
              <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
              <span className="text-xs text-ink-faint">Picked up by Glean</span>
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

      <Disclosure
        open={declinedOpen}
        onOpenChange={setDeclinedOpen}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      >
        <DisclosureTrigger>
          <button
            type="button"
            className="flex w-full items-center justify-between border-t border-hairline py-3 text-left"
          >
            <span className="text-xs font-medium text-ink-faint">
              Declined ({declined.length})
            </span>
            <span
              className={`text-ink-faint transition-transform ${declinedOpen ? "rotate-45" : ""}`}
            >
              +
            </span>
          </button>
        </DisclosureTrigger>
        <DisclosureContent>
          <div className="pb-2">
            {declined.length === 0 ? (
              <Empty text="Nothing declined." />
            ) : (
              declined.map((m) => (
                <MatchRow key={m.id}>
                  <BatchInfo batch={m.batch} distanceKm={m.distanceKm} />
                  <span className="text-xs text-ink-faint">Declined</span>
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

function BatchInfo({ batch, distanceKm }: { batch?: FoodBatch; distanceKm: number }) {
  if (!batch) return <span className="text-sm text-ink-faint">Batch unavailable</span>;
  return (
    <div className="flex items-center gap-3">
      <BatchThumb photoUrl={batch.photoUrl} category={batch.category} size="h-10 w-10" />
      <div>
        <p className="font-medium text-ink">{batch.itemName}</p>
        <p className="text-xs text-ink-faint">
          {batch.quantity} {batch.unit} · {CATEGORY_LABELS[batch.category]} · {distanceKm} km away
        </p>
      </div>
      <FreshnessBadge score={batch.freshnessScore} isSafe={batch.isSafe} />
    </div>
  );
}
