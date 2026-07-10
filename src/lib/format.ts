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

export function freshnessTone(score: number, isSafe: boolean) {
  if (!isSafe) return "red";
  if (score >= 70) return "emerald";
  if (score >= 50) return "amber";
  return "orange";
}

export function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
