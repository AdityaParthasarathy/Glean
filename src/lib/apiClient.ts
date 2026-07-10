import type { FoodBatch, Match, NGO, Retailer } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getRetailers: () => fetch("/api/retailers").then((r) => json<Retailer[]>(r)),

  getBatches: (retailerId?: string) =>
    fetch(`/api/batches${retailerId ? `?retailerId=${retailerId}` : ""}`).then(
      (r) => json<FoodBatch[]>(r)
    ),

  createBatch: (input: {
    retailerId: string;
    category: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    expiryDate?: string | null;
  }) =>
    fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<FoodBatch>(r)),

  sellBatch: (id: string) =>
    fetch(`/api/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sell" }),
    }).then((r) => json<FoodBatch>(r)),

  getNGOs: () => fetch("/api/ngos").then((r) => json<NGO[]>(r)),

  updateNGO: (
    id: string,
    input: Partial<Pick<NGO, "acceptedCategories" | "minFreshness" | "capacityPerDay">>
  ) =>
    fetch(`/api/ngos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<NGO>(r)),

  getMatches: (ngoId?: string) =>
    fetch(`/api/matches${ngoId ? `?ngoId=${ngoId}` : ""}`).then((r) =>
      json<Match[]>(r)
    ),

  findMatch: (batchId: string) =>
    fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId }),
    }).then((r) =>
      json<{ match: Match; ngo: NGO; distanceKm: number } | { candidate: null; reason: string }>(
        r
      )
    ),

  advanceMatch: (id: string, status: Match["status"]) =>
    fetch(`/api/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => json<Match>(r)),

  getImpact: () =>
    fetch("/api/impact").then((r) =>
      json<{
        summary: {
          mealsRedirected: number;
          co2eSavedKg: number;
          revenueRecoveredUsd: number;
          avgFreshnessOfDonations: number;
        };
        logs: unknown[];
      }>(r)
    ),
};
