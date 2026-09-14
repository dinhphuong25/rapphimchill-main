import { NextResponse } from "next/server";
import { getPendingRegistration, savePendingRegistration } from "@/lib/user-store";
import { sendOtpEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Vui lòng cung cấp email" }, { status: 400 });
    }

    const pending = getPendingRegistration(email);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy yêu cầu đăng ký đang chờ hoặc mã đã hết hạn." },
        { status: 404 }
      );
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    savePendingRegistration(pending.email, pending.passwordHash, pending.name, newOtp);

    const emailResult = await sendOtpEmail(pending.email, newOtp, pending.name);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi lại mã OTP mới đến ${pending.email}`,
      devMode: emailResult.devMode,
      devCode: emailResult.devCode,
    });
  } catch (err: any) {
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi gửi lại mã OTP" },
      { status: 500 }
    );
  }
}
