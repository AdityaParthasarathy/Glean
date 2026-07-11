// Core data model — see project spec section 9 (Data model sketch)

export type FoodCategory =
  | "produce"
  | "bakery"
  | "dairy"
  | "packaged"
  | "frozen"
  | "prepared";

export type BatchStatus =
  | "Listed"
  | "Matched"
  | "Picked up"
  | "Delivered"
  | "Composted";

export type MatchStatus =
  | "Matched"
  | "Accepted"
  | "Picked up"
  | "Delivered"
  | "Declined";

export interface Retailer {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface NGO {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  acceptedCategories: FoodCategory[];
  minFreshness: number; // 0-100, will never be offered anything below this
  capacityPerDay: number; // units/day the NGO can realistically receive
  createdAt: string;
}

export interface FoodBatch {
  id: string;
  retailerId: string;
  category: FoodCategory;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number; // original per-unit retail price, USD
  photoUrl: string | null;
  listedAt: string;
  expiryDate: string | null;
  freshnessScore: number; // 0-100
  isSafe: boolean; // false => below safety floor, compost only, never redistributed
  suggestedMarkdownPct: number;
  status: BatchStatus;
}

export interface Match {
  id: string;
  batchId: string;
  ngoId: string | null;
  distanceKm: number;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactLog {
  id: string;
  date: string;
  mealsRedirected: number;
  co2eSavedKg: number;
  revenueRecoveredUsd: number;
  avgFreshnessOfDonations: number;
}

export interface DB {
  retailers: Retailer[];
  ngos: NGO[];
  batches: FoodBatch[];
  matches: Match[];
  impactLogs: ImpactLog[];
}
