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
export function findBestNGOMatch(
  batch: FoodBatch,
  retailer: Retailer,
  ngos: NGO[],
  existingMatches: Match[]
): MatchResult {
  if (!batch.isSafe) {
    return { candidate: null, reason: "Below safety floor — compost only, never redistributed." };
  }

  const matchedQtyByNgo = new Map<string, number>();
  for (const m of existingMatches) {
    if (!m.ngoId || m.status === "Declined") continue;
    matchedQtyByNgo.set(
      m.ngoId,
      (matchedQtyByNgo.get(m.ngoId) ?? 0) + 1
    );
  }

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
