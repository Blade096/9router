import { NextResponse } from "next/server";
import { getDbHealthReport } from "@/lib/localDb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 100);
    const report = await getDbHealthReport(limit);
    return NextResponse.json(report);
  } catch (error) {
    console.error("[API ERROR] /api/usage/db-health failed:", error);
    return NextResponse.json({ error: "Failed to fetch database health report" }, { status: 500 });
  }
}
