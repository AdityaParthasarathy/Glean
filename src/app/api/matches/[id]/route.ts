import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { updateDB } from "@/lib/db";
import { buildImpactLogEntry } from "@/lib/engines/impact";
import type { MatchStatus } from "@/lib/types";

const ALLOWED_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  Matched: ["Picked up", "Declined"],
  "Picked up": ["Delivered"],
  Delivered: [],
  Declined: [],
};

// Advances a match through Listed -> Matched -> Picked up -> Delivered, or
// lets the NGO decline. Declining returns the batch to the open pool
// instead of leaving it stuck — it can be sold to a consumer or re-matched,
// never treated as this NGO's "reject pile".
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const nextStatus: MatchStatus | undefined = body.status;

  if (!nextStatus) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const result = updateDB((db) => {
    const matchIdx = db.matches.findIndex((m) => m.id === id);
    if (matchIdx === -1) return { error: "Match not found" as const };

    const match = db.matches[matchIdx];
    const allowed = ALLOWED_TRANSITIONS[match.status];
    if (!allowed.includes(nextStatus)) {
      return {
        error: `Cannot move match from ${match.status} to ${nextStatus}.`,
      };
    }

    const updatedMatch = {
      ...match,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    db.matches[matchIdx] = updatedMatch;

    const batchIdx = db.batches.findIndex((b) => b.id === match.batchId);
    if (batchIdx !== -1) {
      if (nextStatus === "Declined") {
        db.batches[batchIdx] = { ...db.batches[batchIdx], status: "Listed" };
      } else if (nextStatus === "Picked up") {
        db.batches[batchIdx] = { ...db.batches[batchIdx], status: "Picked up" };
      } else if (nextStatus === "Delivered") {
        db.batches[batchIdx] = { ...db.batches[batchIdx], status: "Delivered" };
        db.impactLogs.push({
          id: randomUUID(),
          ...buildImpactLogEntry(db.batches[batchIdx], "ngo"),
        });
      }
    }

    return { match: updatedMatch };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.match);
}
