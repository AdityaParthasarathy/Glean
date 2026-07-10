import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { summarizeImpact } from "@/lib/engines/impact";

export async function GET() {
  const db = readDB();
  const summary = summarizeImpact(db.impactLogs);
  return NextResponse.json({ summary, logs: db.impactLogs });
}
