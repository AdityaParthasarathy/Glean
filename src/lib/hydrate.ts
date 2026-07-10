import type { FoodBatch } from "./types";
import { computeFreshness } from "./engines/freshness";
import { computeMarkdown } from "./engines/pricing";

/**
 * Freshness decays with real time, so it's recomputed from category/dates
 * rather than trusted from storage. Called before every read so the score
 * shown is always current, not the value at listing time.
 */
export function recomputeBatch(batch: FoodBatch): FoodBatch {
  const freshness = computeFreshness({
    category: batch.category,
    listedAt: batch.listedAt,
    expiryDate: batch.expiryDate,
  });

  const pricing = computeMarkdown({
    category: batch.category,
    freshnessScore: freshness.freshnessScore,
    remainingShelfLifeDays: freshness.remainingShelfLifeDays,
    quantity: batch.quantity,
  });

  const status =
    !freshness.isSafe && batch.status !== "Delivered" && batch.status !== "Picked up"
      ? "Composted"
      : batch.status;

  return {
    ...batch,
    freshnessScore: freshness.freshnessScore,
    isSafe: freshness.isSafe,
    suggestedMarkdownPct: freshness.isSafe ? pricing.suggestedMarkdownPct : 0,
    status,
  };
}
