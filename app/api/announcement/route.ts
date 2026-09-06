import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getSiteConfig();
    return NextResponse.json({
      success: true,
      announcement: config.announcement,
      siteName: config.siteName,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load announcement" },
      { status: 500 }
    );
  }
}
