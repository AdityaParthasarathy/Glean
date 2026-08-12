import type { FoodCategory } from "./types";

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  produce: "Produce",
  bakery: "Bakery",
  dairy: "Dairy",
  packaged: "Packaged",
  frozen: "Frozen",
  prepared: "Prepared",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as FoodCategory[];

// Shared between the 2D dashboards (BatchThumb fallback) and the 3D store
// (Crate.tsx product boxes) so the same category reads as the same color
// everywhere in the app, not just within one surface.
export const CATEGORY_COLOR: Record<FoodCategory, string> = {
  produce: "#7cb342",
  bakery: "#d2a679",
  dairy: "#f5f5f0",
  packaged: "#c9a06a",
  frozen: "#cfe8f5",
  prepared: "#e0935a",
};

export type FreshnessTone = "fresh" | "mid" | "low" | "unsafe";

export function freshnessTone(score: number, isSafe: boolean): FreshnessTone {
  if (!isSafe) return "unsafe";
  if (score >= 70) return "fresh";
  if (score >= 50) return "mid";
  return "low";
}

export function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
