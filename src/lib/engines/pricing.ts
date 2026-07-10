import type { FoodCategory } from "../types";
import { SAFETY_FLOOR } from "./freshness";

// Typical share of a listed batch a retailer would expect to sell at full
// price before it needs a markdown, by category. Used to size the surplus
// component of the discount. Editable, transparent constants — not a model.
const EXPECTED_SELL_THROUGH_PCT: Record<FoodCategory, number> = {
  produce: 70,
  bakery: 60,
  prepared: 50,
  dairy: 75,
  packaged: 85,
  frozen: 85,
};

export interface PricingInput {
  category: FoodCategory;
  freshnessScore: number;
  remainingShelfLifeDays: number;
  quantity: number;
  expectedSellThroughPct?: number;
}

export interface PricingBreakdown {
  freshnessComponent: number;
  urgencyComponent: number;
  surplusComponent: number;
  suggestedMarkdownPct: number;
  explanation: string;
}

/**
 * Transparent markdown formula (spec section 4.2): the discount grows as an
 * item decays toward the safety floor, as it nears the end of its shelf
 * life, and as stock outpaces expected sell-through. Every component is a
 * plain weighted sum so it can be justified line-by-line, not a black box.
 */
export function computeMarkdown(input: PricingInput): PricingBreakdown {
  const sellThroughPct =
    input.expectedSellThroughPct ??
    EXPECTED_SELL_THROUGH_PCT[input.category];

  // 1) Freshness component: distance already traveled from 100 toward the
  // safety floor, scaled 0-60.
  const decayRange = Math.max(1, 100 - SAFETY_FLOOR);
  const decayFraction = Math.min(
    1,
    Math.max(0, (100 - input.freshnessScore) / decayRange)
  );
  const freshnessComponent = Math.round(decayFraction * 60);

  // 2) Urgency component: items with under 3 days of shelf life left get an
  // added push, scaled 0-25.
  const urgencyComponent = Math.round(
    Math.min(1, Math.max(0, (3 - input.remainingShelfLifeDays) / 3)) * 25
  );

  // 3) Surplus component: stock beyond what's expected to sell at full
  // price nudges the discount further, scaled 0-15.
  const surplusRatio = Math.min(1, Math.max(0, 1 - sellThroughPct / 100));
  const surplusComponent = Math.round(surplusRatio * 15);

  const suggestedMarkdownPct = Math.min(
    90,
    Math.max(0, freshnessComponent + urgencyComponent + surplusComponent)
  );

  return {
    freshnessComponent,
    urgencyComponent,
    surplusComponent,
    suggestedMarkdownPct,
    explanation: `${freshnessComponent}% for freshness decay + ${urgencyComponent}% for shelf-life urgency + ${surplusComponent}% for surplus vs. expected ${sellThroughPct}% sell-through.`,
  };
}
