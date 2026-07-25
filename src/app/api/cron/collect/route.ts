import { NextRequest, NextResponse } from "next/server";
import { collectAllFeeds } from "@/lib/collect";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const results = await collectAllFeeds();
  return NextResponse.json({ results });
}
