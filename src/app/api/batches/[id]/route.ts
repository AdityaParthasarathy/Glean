import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDB, updateDB } from "@/lib/db";
import { recomputeBatch } from "@/lib/hydrate";
import { buildImpactLogEntry } from "@/lib/engines/impact";
import { getSession, unauthorized } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const batch = db.batches.find((b) => b.id === id);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(recomputeBatch(batch));
}

// Consumer-channel action: marks a listed batch as sold at the suggested
// markdown price and logs impact. Intentionally unauthenticated — it's
// triggered both by a retailer's own "mark sold" button and by the public,
// no-login Consumer deals page claiming a listed deal. NGO-channel
// deliveries are handled via /api/matches instead, which is auth-gated.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // "edit" mutates a retailer's own listing, unlike "sell" below which is
  // intentionally open to the unauthenticated Consumer deals page — so it
  // needs its own ownership check rather than sharing that route's gate.
  if (body.action === "edit") {
    const session = await getSession();
    if (!session || session.role !== "retailer" || !session.retailerId) {
      return unauthorized("Only a logged-in retailer can edit a listing.");
    }

    const result = updateDB((db) => {
      const idx = db.batches.findIndex((b) => b.id === id);
      if (idx === -1) return null;

      const current = recomputeBatch(db.batches[idx]);
      if (current.retailerId !== session.retailerId) {
        return { error: "You can only edit your own listings." };
      }
      if (current.status !== "Listed") {
        return { error: `Batch is ${current.status} — can only edit while Listed.` };
      }

      const updated = recomputeBatch({
        ...current,
        itemName: body.itemName ?? current.itemName,
        category: body.category ?? current.category,
        quantity: body.quantity !== undefined ? Number(body.quantity) : current.quantity,
        unit: body.unit ?? current.unit,
        unitPrice: body.unitPrice !== undefined ? Number(body.unitPrice) : current.unitPrice,
        expiryDate: body.expiryDate !== undefined ? body.expiryDate : current.expiryDate,
        photoUrl: body.photoUrl !== undefined ? body.photoUrl : current.photoUrl,
      });
      db.batches[idx] = updated;
      return { batch: updated };
    });

    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if ("error" in result)
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.batch);
  }

  const result = updateDB((db) => {
    const idx = db.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const current = recomputeBatch(db.batches[idx]);

    if (body.action === "sell") {
      if (!current.isSafe) {
        return { error: "Below safety floor — cannot be sold." };
      }
      if (current.status !== "Listed") {
        return { error: `Batch is ${current.status}, not available to sell.` };
      }
      const updated = { ...current, status: "Delivered" as const };
      db.batches[idx] = updated;
      db.impactLogs.push({
        id: randomUUID(),
        ...buildImpactLogEntry(updated, "consumer"),
      });
      return { batch: updated };
    }

    return { error: "Unknown action" };
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.batch);
}

// Retailer-only, and only while still Listed — once Glean or an NGO has
// acted on a batch it's no longer the retailer's alone to delete out from
// under them.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "retailer" || !session.retailerId) {
    return unauthorized("Only a logged-in retailer can remove a listing.");
  }

  const result = updateDB((db) => {
    const idx = db.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const current = recomputeBatch(db.batches[idx]);
    if (current.retailerId !== session.retailerId) {
      return { error: "You can only remove your own listings." };
    }
    if (current.status !== "Listed") {
      return { error: `Batch is ${current.status} — can only remove while Listed.` };
    }

    db.batches.splice(idx, 1);
    return { removed: true as const };
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ("error" in result)
    return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ removed: true });
}
