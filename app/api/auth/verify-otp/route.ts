import { NextResponse } from "next/server";
import { verifyAndCreateUser } from "@/lib/user-store";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ email và mã OTP" },
        { status: 400 }
      );
    }

    const result = verifyAndCreateUser(email, otp);
    if (result.error || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "Mã OTP không hợp lệ" },
        { status: 400 }
      );
    }

    const user = result.user;
    const sessionToken = await createUserSessionToken(user.id, user.email);

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

    return response;
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi xác thực mã OTP" },
      { status: 500 }
    );
  }
}
