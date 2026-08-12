"use client";

import { useState, type ComponentType } from "react";
import { Carrot, Wheat, Milk, Package, Snowflake, UtensilsCrossed } from "lucide-react";
import type { FoodCategory } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/format";

const CATEGORY_ICON: Record<FoodCategory, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  produce: Carrot,
  bakery: Wheat,
  dairy: Milk,
  packaged: Package,
  frozen: Snowflake,
  prepared: UtensilsCrossed,
};

export default function BatchThumb({
  photoUrl,
  category,
  size = "h-14 w-14",
}: {
  photoUrl: string | null;
  category: FoodCategory;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICON[category];

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary retailer-supplied URLs, not part of the static asset pipeline
      <img
        src={photoUrl}
        alt=""
        className={`${size} shrink-0 rounded-lg object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  // No photo (or it failed to load) — a category-tinted icon placeholder
  // instead of rendering nothing, so rows/cards always carry some visual
  // weight rather than collapsing to bare text.
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-lg`}
      style={{ backgroundColor: `${CATEGORY_COLOR[category]}33` }}
    >
      <Icon className="h-1/2 w-1/2 opacity-70" style={{ color: CATEGORY_COLOR[category] }} />
    </div>
  );
}
