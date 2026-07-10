import type { FoodCategory } from "../types";

/**
 * Hard safety floor: freshness scores below this are never redistributed,
 * to a consumer or an NGO. Compost only. See project spec section 3.
 */
export const SAFETY_FLOOR = 35;

type Methodology = "computer_vision" | "expiry_decay_curve";

// CV-scored categories: no reliable expiry date, freshness read from a
// (simulated) visual signal that degrades over time since listing.
// Expiry-curve categories: CV isn't reliable on packaging, so we OCR the
// printed date and decay linearly against a category shelf-life baseline.
const CATEGORY_PROFILE: Record<
  FoodCategory,
  { methodology: Methodology; shelfLifeDays: number }
> = {
  produce: { methodology: "computer_vision", shelfLifeDays: 6 },
  bakery: { methodology: "computer_vision", shelfLifeDays: 3 },
  prepared: { methodology: "computer_vision", shelfLifeDays: 2 },
  dairy: { methodology: "expiry_decay_curve", shelfLifeDays: 12 },
  packaged: { methodology: "expiry_decay_curve", shelfLifeDays: 180 },
  frozen: { methodology: "expiry_decay_curve", shelfLifeDays: 270 },
};

export interface FreshnessInput {
  category: FoodCategory;
  listedAt: string | Date;
  expiryDate?: string | Date | null;
  /** Optional simulated CV visual-quality reading (0-100). If omitted, derived from days elapsed. */
  visualQualityHint?: number | null;
  now?: string | Date;
}

export interface FreshnessResult {
  freshnessScore: number;
  isSafe: boolean;
  remainingShelfLifeDays: number;
  methodology: Methodology;
  explanation: string;
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function computeFreshness(input: FreshnessInput): FreshnessResult {
  const now = new Date(input.now ?? Date.now());
  const listedAt = new Date(input.listedAt);
  const profile = CATEGORY_PROFILE[input.category];

  if (profile.methodology === "computer_vision") {
    const daysElapsed = Math.max(0, daysBetween(listedAt, now));
    const timeDecayScore = Math.max(
      0,
      100 - (daysElapsed / profile.shelfLifeDays) * 100
    );
    const visualScore = input.visualQualityHint ?? timeDecayScore;
    // Blend: visual read dominates, but time-since-listing keeps it honest
    // if no fresh visual signal has come in.
    const freshnessScore = Math.round(
      Math.max(0, Math.min(100, visualScore * 0.7 + timeDecayScore * 0.3))
    );
    const remainingShelfLifeDays = Math.max(
      0,
      profile.shelfLifeDays - daysElapsed
    );
    return {
      freshnessScore,
      isSafe: freshnessScore >= SAFETY_FLOOR,
      remainingShelfLifeDays: Math.round(remainingShelfLifeDays * 10) / 10,
      methodology: profile.methodology,
      explanation: `Computer-vision read (color/texture/blemish drift) blended with ${daysElapsed.toFixed(
        1
      )} days since listing against a ${profile.shelfLifeDays}-day shelf life.`,
    };
  }

  // expiry_decay_curve
  const totalShelfLifeDays =
    input.expiryDate != null
      ? Math.max(1, daysBetween(listedAt, new Date(input.expiryDate)))
      : profile.shelfLifeDays;
  const expiry = input.expiryDate
    ? new Date(input.expiryDate)
    : new Date(listedAt.getTime() + profile.shelfLifeDays * 86400000);
  const daysRemaining = daysBetween(now, expiry);
  const fraction = Math.max(
    0,
    Math.min(1, daysRemaining / totalShelfLifeDays)
  );
  const freshnessScore = Math.round(fraction * 100);

  return {
    freshnessScore,
    isSafe: freshnessScore >= SAFETY_FLOOR && daysRemaining > 0,
    remainingShelfLifeDays: Math.round(daysRemaining * 10) / 10,
    methodology: profile.methodology,
    explanation: `OCR-read expiry date, ${daysRemaining.toFixed(
      1
    )} days remaining of a ${totalShelfLifeDays.toFixed(
      0
    )}-day category decay curve.`,
  };
}
