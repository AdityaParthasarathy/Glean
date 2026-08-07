"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { formatUsd } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";

const POLL_MS = 3000;

interface Summary {
  mealsRedirected: number;
  co2eSavedKg: number;
  revenueRecoveredUsd: number;
  avgFreshnessOfDonations: number;
}

export default function ImpactPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  const refresh = useCallback(async () => {
    const r = await api.getImpact();
    setSummary(r.summary);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  usePolling(refresh, POLL_MS);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Impact dashboard</h1>
        <p className="text-sm text-zinc-500">
          Tracks quality alongside quantity — average freshness of donated food is reported
          so &ldquo;meals redirected&rdquo; can&rsquo;t hide a quality gap.
        </p>
      </div>

      {!summary ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Meals redirected" value={summary.mealsRedirected.toLocaleString()} />
          <Stat
            label="CO2e avoided"
            value={`${summary.co2eSavedKg.toLocaleString()} kg`}
          />
          <Stat
            label="Revenue recovered"
            value={formatUsd(summary.revenueRecoveredUsd)}
          />
          <Stat
            label="Avg. freshness of donated food"
            value={
              summary.mealsRedirected > 0
                ? `${summary.avgFreshnessOfDonations}/100`
                : "—"
            }
            accent
          />
        </div>
      )}

      <p className="mt-10 text-xs text-zinc-400">
        Figures reflect demo data only — NGO accounts and matches in this environment are
        simulated, not a real partnership.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          accent ? "text-emerald-700 dark:text-emerald-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
