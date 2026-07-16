import type { FoodBatch, Match, NGO, Retailer, Role } from "./types";

export interface SessionInfo {
  accountId: string;
  role: Role;
  retailerId: string | null;
  ngoId: string | null;
  displayName: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getMe: () =>
    fetch("/api/auth/me").then((r) => json<{ session: SessionInfo | null }>(r)),

  login: (username: string, password: string) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((r) => json<{ role: Role; displayName: string; redirectTo: string }>(r)),

  logout: () => fetch("/api/auth/logout", { method: "POST" }),

  getRetailers: () => fetch("/api/retailers").then((r) => json<Retailer[]>(r)),

  getBatches: (retailerId?: string) =>
    fetch(`/api/batches${retailerId ? `?retailerId=${retailerId}` : ""}`).then(
      (r) => json<FoodBatch[]>(r)
    ),

  // retailerId is derived server-side from the logged-in session, not from
  // this input — kept out of the type to make that explicit.
  createBatch: (input: {
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

  getNGO: (id: string) => fetch(`/api/ngos/${id}`).then((r) => json<NGO>(r)),

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
