import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDB, updateDB } from "@/lib/db";
import { recomputeBatch } from "@/lib/hydrate";
import { findBestNGOMatch } from "@/lib/engines/matching";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ngoId = searchParams.get("ngoId");
  const db = readDB();
  let matches = db.matches;
  if (ngoId) matches = matches.filter((m) => m.ngoId === ngoId);
  return NextResponse.json(matches);
}

// "Find NGO match" action: runs the greedy nearest-match engine against
// each NGO's own acceptance rules. Creates a proposed Match the NGO can
// still decline from its own feed — this is a proposal, not a push.
export async function POST(req: Request) {
  const body = await req.json();
  const { batchId } = body;
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const result = updateDB((db) => {
    const batchIdx = db.batches.findIndex((b) => b.id === batchId);
    if (batchIdx === -1) return { error: "Batch not found" as const };

    const batch = recomputeBatch(db.batches[batchIdx]);
    db.batches[batchIdx] = batch;

    if (batch.status !== "Listed") {
      return { error: `Batch is ${batch.status}, not available for matching.` };
    }

    const retailer = db.retailers.find((r) => r.id === batch.retailerId);
    if (!retailer) return { error: "Retailer not found" as const };

    const matchResult = findBestNGOMatch(
      batch,
      retailer,
      db.ngos,
      db.matches
    );

    if (!matchResult.candidate) {
      return { candidate: null, reason: matchResult.reason };
    }

    const match = {
      id: randomUUID(),
      batchId,
      ngoId: matchResult.candidate.ngo.id,
      distanceKm: Math.round(matchResult.candidate.distanceKm * 10) / 10,
      status: "Matched" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.matches.push(match);
    db.batches[batchIdx] = { ...batch, status: "Matched" };

    return { match, ngo: matchResult.candidate.ngo, distanceKm: match.distanceKm };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
