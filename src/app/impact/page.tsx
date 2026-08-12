"use client";

import { useEffect, useState, useCallback } from "react";
import { Soup, Leaf, Wallet, Sparkles } from "lucide-react";
import { api } from "@/lib/apiClient";
import type { ImpactLog } from "@/lib/types";
import { formatUsd } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import { TextMorph } from "@/components/core/text-morph";
import PageHeaderAccent from "@/components/PageHeaderAccent";
import ImpactTrendChart, { type TrendPoint } from "@/components/ImpactTrendChart";

const POLL_MS = 3000;

interface Summary {
  mealsRedirected: number;
  co2eSavedKg: number;
  revenueRecoveredUsd: number;
  avgFreshnessOfDonations: number;
}

function aggregateByDay(logs: ImpactLog[]): TrendPoint[] {
  const byDay = new Map<string, number>();
  for (const log of logs) {
    const day = log.date.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + log.mealsRedirected);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export default function ImpactPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  const refresh = useCallback(async () => {
    const r = await api.getImpact();
    setSummary(r.summary);
    setTrend(aggregateByDay(r.logs));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  usePolling(refresh, POLL_MS);

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-12">
        <PageHeaderAccent className="mb-4" />
        <h1 className="font-serif text-3xl tracking-tight text-ink">Impact</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Tracks quality alongside quantity — average freshness of donated food is reported
          so &ldquo;meals redirected&rdquo; can&rsquo;t hide a quality gap.
        </p>
      </div>

      {!summary ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={Soup}
              label="Meals redirected"
              value={summary.mealsRedirected.toLocaleString()}
            />
            <Stat
              icon={Leaf}
              label="CO2e avoided"
              value={`${summary.co2eSavedKg.toLocaleString()} kg`}
            />
            <Stat
              icon={Wallet}
              label="Revenue recovered"
              value={formatUsd(summary.revenueRecoveredUsd)}
            />
            <Stat
              icon={Sparkles}
              label="Avg. freshness donated"
              value={
                summary.mealsRedirected > 0 ? `${summary.avgFreshnessOfDonations}/100` : "—"
              }
              accent
            />
          </div>

          {trend.length >= 2 && (
            <div className="mt-6 rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
              <p className="mb-4 text-xs font-medium tracking-wide text-ink-faint uppercase">
                Meals redirected — last {trend.length} days
              </p>
              <ImpactTrendChart data={trend} valueLabel="meals" />
            </div>
          )}
        </>
      )}

      <p className="mt-12 text-xs text-ink-faint">
        Figures reflect demo data only — NGO accounts and matches in this environment are
        simulated, not a real partnership.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm">
      <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-ink-faint"}`} />
      <p className="mt-3 text-xs font-medium tracking-wide text-ink-faint uppercase">{label}</p>
      <TextMorph
        as="p"
        className={`mt-1 font-semibold text-3xl ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </TextMorph>
    </div>
  );
}
