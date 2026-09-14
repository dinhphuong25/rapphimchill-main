import { NextResponse } from "next/server";
import { findUserByEmail, hashPassword, savePendingRegistration } from "@/lib/user-store";
import { sendOtpEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.endsWith("@gmail.com")) {
      return NextResponse.json(
        { success: false, error: "Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com" },
        { status: 400 }
      );
    }

    const localPart = normalizedEmail.replace("@gmail.com", "").trim();
    if (!localPart || localPart.length < 3) {
      return NextResponse.json(
        { success: false, error: "Địa chỉ Gmail không hợp lệ (tên tài khoản quá ngắn)" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
    }

    // Check existing
    const existing = findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập." },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await hashPassword(password);
    const displayName = typeof name === "string" && name.trim()
      ? name.trim().replace(/\s+/g, " ")
      : normalizedEmail.split("@")[0];

    savePendingRegistration(normalizedEmail, passwordHash, displayName, otp);

    // Send email
    const emailResult = await sendOtpEmail(normalizedEmail, otp, displayName);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Không thể gửi email OTP. Vui lòng kiểm tra lại địa chỉ email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mã OTP kích hoạt đã được gửi đến ${normalizedEmail}`,
      devMode: emailResult.devMode,
      devCode: emailResult.devCode,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi tạo tài khoản" },
      { status: 500 }
    );
  }
}
