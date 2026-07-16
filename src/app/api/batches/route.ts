import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDB, updateDB } from "@/lib/db";
import { recomputeBatch } from "@/lib/hydrate";
import { getSession, unauthorized } from "@/lib/session";
import type { FoodBatch } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const retailerId = searchParams.get("retailerId");

  const db = readDB();
  let batches = db.batches.map(recomputeBatch);
  if (retailerId) {
    batches = batches.filter((b) => b.retailerId === retailerId);
  }
  return NextResponse.json(batches);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "retailer" || !session.retailerId) {
    return unauthorized("Only a logged-in retailer can list inventory.");
  }

  const body = await req.json();

  const required = ["category", "itemName", "quantity", "unit"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const batch: FoodBatch = recomputeBatch({
    id: randomUUID(),
    retailerId: session.retailerId,
    category: body.category,
    itemName: body.itemName,
    quantity: Number(body.quantity),
    unit: body.unit,
    unitPrice: Number(body.unitPrice ?? 0),
    photoUrl: body.photoUrl ?? null,
    listedAt: new Date().toISOString(),
    expiryDate: body.expiryDate ?? null,
    freshnessScore: 0,
    isSafe: true,
    suggestedMarkdownPct: 0,
    status: "Listed",
  });

  updateDB((db) => {
    db.batches.push(batch);
  });

  return NextResponse.json(batch, { status: 201 });
}
