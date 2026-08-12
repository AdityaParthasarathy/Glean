import type { FoodBatch, Match, NGO, Retailer } from "../types";

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface MatchCandidate {
  ngo: NGO;
  distanceKm: number;
}

export interface MatchResult {
  candidate: MatchCandidate | null;
  reason: string;
}

/**
 * Greedy nearest-match: filters NGOs down to those whose own acceptance
 * rules (category, minimum freshness, remaining daily capacity) admit this
 * batch, then picks the nearest one. NGOs set these rules themselves — this
 * never routes food to an NGO that hasn't opted into that category/quality
 * tier. See project spec section 3 ("NGOs choose, they don't just receive").
 */
// Total *quantity* already matched against each NGO today (active matches
// only — Declined doesn't count), keyed by ngoId. capacityPerDay is
// documented as "units/day", so this has to sum each match's batch
// quantity, not just count matches — a batch of 40 units uses as much
// capacity as 40 batches of 1 unit would. Match itself only stores
// batchId, so this needs the batches array to look quantity up.
export function matchedQuantityByNgo(
  existingMatches: Match[],
  batches: FoodBatch[]
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const m of existingMatches) {
    if (!m.ngoId || m.status === "Declined") continue;
    const batch = batches.find((b) => b.id === m.batchId);
    if (!batch) continue;
    totals.set(m.ngoId, (totals.get(m.ngoId) ?? 0) + batch.quantity);
  }
  return totals;
}

// How many more units this NGO can take today, per its own capacityPerDay
// preference. Mirrors the accounting findBestNGOMatch uses internally so
// the number shown in the UI always matches what the engine will actually
// allow.
export function remainingCapacity(
  ngo: NGO,
  existingMatches: Match[],
  batches: FoodBatch[]
): number {
  const used = matchedQuantityByNgo(existingMatches, batches).get(ngo.id) ?? 0;
  return Math.max(0, ngo.capacityPerDay - used);
}

export function findBestNGOMatch(
  batch: FoodBatch,
  retailer: Retailer,
  ngos: NGO[],
  existingMatches: Match[],
  batches: FoodBatch[]
): MatchResult {
  if (!batch.isSafe) {
    return { candidate: null, reason: "Below safety floor — compost only, never redistributed." };
  }

  const matchedQtyByNgo = matchedQuantityByNgo(existingMatches, batches);

  const eligible: MatchCandidate[] = ngos
    .filter((ngo) => ngo.acceptedCategories.includes(batch.category))
    .filter((ngo) => batch.freshnessScore >= ngo.minFreshness)
    .filter((ngo) => {
      const alreadyMatched = matchedQtyByNgo.get(ngo.id) ?? 0;
      return alreadyMatched + batch.quantity <= ngo.capacityPerDay;
    })
    .map((ngo) => ({
      ngo,
      distanceKm: haversineDistanceKm(
        retailer.lat,
        retailer.lng,
        ngo.lat,
        ngo.lng
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (eligible.length === 0) {
    return {
      candidate: null,
      reason:
        "No NGO currently accepts this category/freshness tier within capacity.",
    };
  }

  return { candidate: eligible[0], reason: "Nearest eligible NGO match." };
}
