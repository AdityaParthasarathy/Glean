import { NextResponse } from "next/server";
import { readDB, updateDB } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = readDB();
  const ngo = db.ngos.find((n) => n.id === id);
  if (!ngo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ngo);
}

// Lets an NGO set its own acceptance rules — categories, minimum freshness,
// daily capacity — rather than having surplus pushed onto it unfiltered.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getSession();
  if (!session || session.role !== "ngo" || session.ngoId !== id) {
    return unauthorized("Only the NGO's own logged-in account can edit its preferences.");
  }

  const body = await req.json();

  const updated = updateDB((db) => {
    const idx = db.ngos.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    db.ngos[idx] = {
      ...db.ngos[idx],
      ...(body.acceptedCategories !== undefined && {
        acceptedCategories: body.acceptedCategories,
      }),
      ...(body.minFreshness !== undefined && {
        minFreshness: Number(body.minFreshness),
      }),
      ...(body.capacityPerDay !== undefined && {
        capacityPerDay: Number(body.capacityPerDay),
      }),
    };
    return db.ngos[idx];
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
