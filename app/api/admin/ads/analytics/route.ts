import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { getAdsAnalyticsSummary } from "@/lib/ads-analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAdsAnalyticsSummary();
    return NextResponse.json({ success: true, analytics: summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
