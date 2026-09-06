import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng điền đầy đủ tài khoản và mật khẩu!" },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác!" },
        { status: 401 }
      );
    }

    // Create secure signed session token
    const token = await createSessionToken(username.trim());

    const res = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
    });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra trong quá trình đăng nhập!" },
      { status: 500 }
    );
  }
}
