import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { runStreamHealthCheck } from "@/lib/health-checker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let limit = 6;
    try {
      const body = await req.json();
      if (body?.limit && Number(body.limit) > 0) {
        limit = Math.min(20, Number(body.limit));
      }
    } catch {}

    const result = await runStreamHealthCheck(limit);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Health check failed" }, { status: 500 });
  }
}
