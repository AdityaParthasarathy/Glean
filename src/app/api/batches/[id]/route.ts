import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDB, updateDB } from "@/lib/db";
import { recomputeBatch } from "@/lib/hydrate";
import { buildImpactLogEntry } from "@/lib/engines/impact";

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
// markdown price and logs impact. NGO-channel deliveries are handled via
// /api/matches instead, since those go through the match lifecycle.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

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
