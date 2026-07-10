import type { FoodBatch, ImpactLog } from "../types";

// Illustrative, transparent constants for the demo — not sourced from a
// live LCA model. Swap for real per-category figures before any public claim.
const CO2E_KG_AVOIDED_PER_UNIT = 2.5;

export type RedistributionChannel = "ngo" | "consumer";

/**
 * Builds one ImpactLog entry for a delivered/sold batch. NGO donations log
 * meals + CO2e but no revenue (it's not a sale); consumer markdown sales log
 * the recovered margin too. Freshness is logged either way so the impact
 * dashboard can report quality, not just quantity (spec section 3).
 */
export function buildImpactLogEntry(
  batch: FoodBatch,
  channel: RedistributionChannel
): Omit<ImpactLog, "id"> {
  const revenueRecoveredUsd =
    channel === "consumer"
      ? Math.round(
          batch.unitPrice *
            (1 - batch.suggestedMarkdownPct / 100) *
            batch.quantity *
            100
        ) / 100
      : 0;

  return {
    date: new Date().toISOString(),
    mealsRedirected: batch.quantity,
    co2eSavedKg:
      Math.round(batch.quantity * CO2E_KG_AVOIDED_PER_UNIT * 10) / 10,
    revenueRecoveredUsd,
    avgFreshnessOfDonations: batch.freshnessScore,
  };
}

export interface ImpactSummary {
  mealsRedirected: number;
  co2eSavedKg: number;
  revenueRecoveredUsd: number;
  avgFreshnessOfDonations: number;
}

export function summarizeImpact(logs: ImpactLog[]): ImpactSummary {
  if (logs.length === 0) {
    return {
      mealsRedirected: 0,
      co2eSavedKg: 0,
      revenueRecoveredUsd: 0,
      avgFreshnessOfDonations: 0,
    };
  }
  const totalMeals = logs.reduce((s, l) => s + l.mealsRedirected, 0);
  const weightedFreshness = logs.reduce(
    (s, l) => s + l.avgFreshnessOfDonations * l.mealsRedirected,
    0
  );
  return {
    mealsRedirected: totalMeals,
    co2eSavedKg: Math.round(logs.reduce((s, l) => s + l.co2eSavedKg, 0) * 10) / 10,
    revenueRecoveredUsd:
      Math.round(logs.reduce((s, l) => s + l.revenueRecoveredUsd, 0) * 100) /
      100,
    avgFreshnessOfDonations:
      totalMeals > 0 ? Math.round((weightedFreshness / totalMeals) * 10) / 10 : 0,
  };
}
