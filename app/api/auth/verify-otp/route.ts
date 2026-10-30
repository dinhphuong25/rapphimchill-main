import { NextResponse } from "next/server";
import { verifyAndCreateUserPersistent, type PendingRegistration } from "@/lib/user-store";
import {
  createUserSessionToken,
  PENDING_REGISTRATION_COOKIE_NAME,
  USER_COOKIE_NAME,
  verifyPendingRegistrationToken,
} from "@/lib/user-token";

// OTP Brute-Force Shield: max 5 failed guesses per 10 minutes
const otpAttemptMap = new Map<string, { count: number; lockUntil: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp || typeof email !== "string" || typeof otp !== "string") {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ email và mã OTP" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existingAttempt = otpAttemptMap.get(normalizedEmail);
    if (existingAttempt && existingAttempt.lockUntil > now) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng chờ 10 phút hoặc gửi lại mã OTP mới.",
        },
        { status: 429 }
      );
    }

    const pendingCookie = getCookie(request, PENDING_REGISTRATION_COOKIE_NAME);
    const pendingToken = await verifyPendingRegistrationToken(pendingCookie);
    const pendingOverride: PendingRegistration | undefined = pendingToken || undefined;
    const result = await verifyAndCreateUserPersistent(normalizedEmail, otp.trim(), pendingOverride);
    if (result.error || !result.user) {
      const count = (existingAttempt?.count || 0) + 1;
      otpAttemptMap.set(normalizedEmail, {
        count,
        lockUntil: count >= 5 ? now + 10 * 60 * 1000 : 0,
      });
      return NextResponse.json(
        { success: false, error: result.error || "Mã OTP không hợp lệ" },
        { status: 400 }
      );
    }

    otpAttemptMap.delete(normalizedEmail);

    const user = result.user;
    const sessionToken = await createUserSessionToken(user.id, user.email, {
      name: user.name,
      avatar: user.avatar,
      role: user.role || "user",
      isVerified: user.isVerified,
    });

    const response = NextResponse.json({
      success: true,
      message: "Kích hoạt tài khoản thành công!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        favorites: user.favorites || [],
        history: user.history || [],
      },
    });

    response.cookies.set({
      name: USER_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 30, // 30 days
      path: "/",
    });
    response.cookies.set({
      name: PENDING_REGISTRATION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi xác thực mã OTP" },
      { status: 500 }
    );
  }
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null;
}
