import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { createReport, getReports, updateReportStatus, deleteReport } from "@/lib/report-store";

// In-memory rate limiting map for user reports (prevents spam: max 3 reports per minute per IP)
const reportRateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const now = Date.now();
    const rate = reportRateLimit.get(ip);
    if (rate && rate.resetTime > now) {
      if (rate.count >= 3) {
        return NextResponse.json(
          { success: false, error: "Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 1 phút." },
          { status: 429 }
        );
      }
      rate.count += 1;
    } else {
      reportRateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    }

    const body = await req.json();
    const { movieSlug, movieName, episodeName, serverName, issueType, description } = body;

    if (!movieSlug || !movieName || !issueType) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    const report = await createReport({
      movieSlug: String(movieSlug).trim(),
      movieName: String(movieName).trim(),
      episodeName: episodeName ? String(episodeName).trim() : undefined,
      serverName: serverName ? String(serverName).trim() : undefined,
      issueType: String(issueType).trim(),
      description: description ? String(description).slice(0, 500).trim() : undefined,
      ip,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi gửi báo cáo." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await getReports(200);
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi khi tải danh sách báo cáo." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || (status !== "pending" && status !== "resolved")) {
      return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const ok = await updateReportStatus(id, status);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ success: false, error: "Lỗi cập nhật." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID báo cáo." }, { status: 400 });
    }

    const ok = await deleteReport(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ success: false, error: "Lỗi xóa báo cáo." }, { status: 500 });
  }
}
