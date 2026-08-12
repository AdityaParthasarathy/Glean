"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Store, PackageOpen } from "lucide-react";
import { api, type SessionInfo } from "@/lib/apiClient";
import type { FoodBatch, FoodCategory, Match, NGO } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABELS, formatUsd } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import { useUnseenActivity } from "@/lib/useUnseenActivity";
import FreshnessBadge from "@/components/FreshnessBadge";
import StatusStepper from "@/components/StatusStepper";
import PageHeaderAccent from "@/components/PageHeaderAccent";
import BatchThumb from "@/components/BatchThumb";
import ActivityBadge from "@/components/ActivityBadge";

const EXPIRY_CATEGORIES: FoodCategory[] = ["dairy", "packaged", "frozen"];
const POLL_MS = 3000;

const fieldLabel = "text-xs font-medium text-ink-faint";
const fieldInput =
  "mt-1.5 w-full rounded-lg border border-hairline-strong bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function RetailerPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "produce" as FoodCategory,
    itemName: "",
    quantity: "10",
    unit: "units",
    unitPrice: "3.00",
    expiryDate: "",
    photoUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    itemName: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    photoUrl: "",
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const { unseenCount, dismiss: dismissActivity } = useUnseenActivity(
    matches.map((m) => `${m.id}:${m.status}`)
  );

  const refresh = useCallback(async (rid: string) => {
    const [b, n, m] = await Promise.all([
      api.getBatches(rid),
      api.getNGOs(),
      api.getMatches(),
    ]);
    setBatches(b);
    setNgos(n);
    setMatches(m);
  }, []);

  useEffect(() => {
    api.getMe().then(({ session: s }) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session?.retailerId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on session load
    setLoading(true);
    refresh(session.retailerId).finally(() => setLoading(false));
  }, [session, refresh]);

  // Picks up status changes made from Glean/NGO sessions (e.g. a second
  // laptop) without a manual reload.
  usePolling(
    () => {
      if (session?.retailerId) refresh(session.retailerId);
    },
    POLL_MS,
    !!session?.retailerId
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.retailerId) return;
    await api.createBatch({
      category: form.category,
      itemName: form.itemName || `${CATEGORY_LABELS[form.category]} batch`,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      photoUrl: form.photoUrl || null,
    });
    setForm((f) => ({ ...f, itemName: "", photoUrl: "" }));
    refresh(session.retailerId);
  }

  async function handleSell(batchId: string) {
    if (!session?.retailerId) return;
    setBusyId(batchId);
    try {
      await api.sellBatch(batchId);
      await refresh(session.retailerId);
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(b: FoodBatch) {
    setEditingId(b.id);
    setEditError(null);
    setConfirmRemoveId(null);
    setEditForm({
      itemName: b.itemName,
      quantity: String(b.quantity),
      unit: b.unit,
      unitPrice: String(b.unitPrice),
      photoUrl: b.photoUrl ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(batchId: string) {
    if (!session?.retailerId) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await api.editBatch(batchId, {
        itemName: editForm.itemName,
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        unitPrice: Number(editForm.unitPrice),
        photoUrl: editForm.photoUrl || null,
      });
      setEditingId(null);
      await refresh(session.retailerId);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setEditBusy(false);
    }
  }

  async function handleRemove(batchId: string) {
    if (!session?.retailerId) return;
    setRemoveBusyId(batchId);
    try {
      await api.deleteBatch(batchId);
      await refresh(session.retailerId);
    } finally {
      setRemoveBusyId(null);
      setConfirmRemoveId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeaderAccent className="mb-4" />
          <h1 className="font-serif text-3xl tracking-tight text-ink">Retailer</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {session ? `Logged in as ${session.displayName}. ` : ""}List inventory and see
            freshness scores and suggested markdowns. Listed items are automatically visible to
            Glean for NGO matching — you can also sell directly to consumers.
          </p>
        </div>
        <Link
          href="/retailer/warehouse"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-hairline-strong px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <Store className="h-3.5 w-3.5" />
          Walk the aisle →
        </Link>
      </div>

      <ActivityBadge count={unseenCount} onDismiss={dismissActivity} />

      <form
        onSubmit={handleAdd}
        className="mb-14 grid grid-cols-1 gap-5 rounded-2xl border border-hairline bg-surface p-6 shadow-sm sm:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label className={fieldLabel}>Item name</label>
          <input
            value={form.itemName}
            onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
            placeholder="e.g. Bananas"
            className={fieldInput}
          />
        </div>
        <div>
          <label className={fieldLabel}>Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value as FoodCategory }))
            }
            className={fieldInput}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>Quantity</label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className={fieldInput}
          />
        </div>
        <div>
          <label className={fieldLabel}>Unit price</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            className={fieldInput}
          />
        </div>
        {EXPIRY_CATEGORIES.includes(form.category) && (
          <div>
            <label className={fieldLabel}>Expiry date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className={fieldInput}
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={fieldLabel}>Photo URL (optional)</label>
          <input
            value={form.photoUrl}
            onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
            placeholder="https://…"
            className={fieldInput}
          />
        </div>
        <div className="flex items-end sm:col-span-1">
          <button
            type="submit"
            disabled={!session?.retailerId}
            className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Add to inventory
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-ink-faint">Loading inventory…</p>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline-strong py-16 text-center">
          <PackageOpen className="h-6 w-6 text-ink-faint" />
          <p className="text-sm text-ink-faint">No inventory listed yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm"
            >
              {editingId === b.id ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label className={fieldLabel}>Item name</label>
                    <input
                      value={editForm.itemName}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, itemName: e.target.value }))
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Unit price</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editForm.unitPrice}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, unitPrice: e.target.value }))
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Photo URL</label>
                    <input
                      value={editForm.photoUrl}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, photoUrl: e.target.value }))
                      }
                      placeholder="https://…"
                      className={fieldInput}
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-5">
                    <button
                      onClick={() => handleSaveEdit(b.id)}
                      disabled={editBusy}
                      className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={editBusy}
                      className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {editError && <span className="text-xs text-status-unsafe">{editError}</span>}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <BatchThumb photoUrl={b.photoUrl} category={b.category} />
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-serif text-lg text-ink">{b.itemName}</h3>
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-faint">
                            {CATEGORY_LABELS[b.category]}
                          </span>
                        </div>
                        <p className="text-xs text-ink-faint">
                          {b.quantity} {b.unit} · {formatUsd(b.unitPrice)}/{b.unit} listed price
                        </p>
                      </div>
                    </div>
                    <FreshnessBadge score={b.freshnessScore} isSafe={b.isSafe} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <StatusStepper status={b.status} />
                    {b.isSafe && (
                      <div className="text-sm">
                        <span className="font-medium text-accent">
                          {b.suggestedMarkdownPct}% suggested markdown
                        </span>
                        <span className="ml-2 text-ink-faint">
                          → {formatUsd(b.unitPrice * (1 - b.suggestedMarkdownPct / 100))}/
                          {b.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {b.status === "Listed" && b.isSafe && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-ink-faint">
                        Available for transfer — Glean will route this to an NGO or you can sell it
                        directly.
                      </span>
                      <button
                        onClick={() => handleSell(b.id)}
                        disabled={busyId === b.id}
                        className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                      >
                        Mark sold to consumer
                      </button>
                      <button
                        onClick={() => startEdit(b)}
                        className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      {confirmRemoveId === b.id ? (
                        <>
                          <span className="text-xs text-ink-faint">Remove this listing?</span>
                          <button
                            onClick={() => handleRemove(b.id)}
                            disabled={removeBusyId === b.id}
                            className="rounded-full bg-status-unsafe px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                          >
                            Confirm remove
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            disabled={removeBusyId === b.id}
                            className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(b.id)}
                          className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-status-unsafe hover:text-status-unsafe"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {b.status !== "Listed" && b.status !== "Composted" && (
                <p className="mt-3 text-xs text-ink-faint">
                  {(() => {
                    const match = matches.find(
                      (m) => m.batchId === b.id && m.status !== "Declined"
                    );
                    const ngoName =
                      ngos.find((n) => n.id === match?.ngoId)?.name ?? "matched NGO";
                    const STATUS_LABEL: Record<string, string> = {
                      Matched: `Proposed to ${ngoName} — awaiting their response.`,
                      Accepted: `Accepted by ${ngoName} — awaiting pickup by Glean.`,
                      "Picked up": `Picked up by Glean, in transit to ${ngoName}.`,
                      Delivered: `Delivered to ${ngoName}.`,
                    };
                    return match ? STATUS_LABEL[match.status] : null;
                  })()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
