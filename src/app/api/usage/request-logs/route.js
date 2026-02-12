import { NextResponse } from "next/server";
import { getRecentLogs } from "@/lib/usageDb";

export async function GET() {
  try {
    console.log("[API] /api/usage/request-logs called");
    const logs = await getRecentLogs(200);
    console.log("[API] Retrieved logs count:", logs.length);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[API ERROR] /api/usage/logs failed:", error);
    console.error("[API ERROR] Stack:", error?.stack);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
