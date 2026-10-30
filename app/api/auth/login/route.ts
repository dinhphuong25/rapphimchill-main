import { NextRequest, NextResponse } from "next/server";
import { findUserByEmailPersistent, verifyPassword, isSuperAdmin } from "@/lib/user-store";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";
import { createSessionToken, ADMIN_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";

// Brute-force lockout tracker (5 failed attempts -> 15 minute lockout)
const loginAttemptMap = new Map<string, { failures: number; lockUntil: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000;

function checkBruteForce(key: string): { blocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const record = loginAttemptMap.get(key);
  if (!record) return { blocked: false, remainingSeconds: 0 };

  if (record.lockUntil > now) {
    return {
      blocked: true,
      remainingSeconds: Math.ceil((record.lockUntil - now) / 1000),
    };
  }

  if (now - record.lastAttempt > WINDOW_DURATION_MS) {
    loginAttemptMap.delete(key);
  }
  return { blocked: false, remainingSeconds: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  if (loginAttemptMap.size > 5000) loginAttemptMap.clear();
  const existing = loginAttemptMap.get(key);
  const failures = existing && now - existing.lastAttempt <= WINDOW_DURATION_MS ? existing.failures + 1 : 1;
  const lockUntil = failures >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;
  loginAttemptMap.set(key, { failures, lockUntil, lastAttempt: now });
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Email và Mật khẩu" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const attemptKey = `${ip}:${normalizedEmail}`;

    const bruteForceStatus = checkBruteForce(attemptKey);
    if (bruteForceStatus.blocked) {
      const mins = Math.ceil(bruteForceStatus.remainingSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản tạm khóa đăng nhập do nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng thử lại sau ${mins} phút.`,
        },
        { status: 429 }
      );
    }

    const user = await findUserByEmailPersistent(normalizedEmail);
    if (!user) {
      recordFailedAttempt(attemptKey);
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const isValid =
      (await verifyPassword(password, user.passwordHash)) ||
      (password !== password.trim() && (await verifyPassword(password.trim(), user.passwordHash)));
    if (!isValid) {
      recordFailedAttempt(attemptKey);
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful authentication
    loginAttemptMap.delete(attemptKey);

    // Check if account is permanently locked
    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản của bạn đã bị KHÓA VĨNH VIỄN do: "${user.banReason || "Vi phạm quy chế sử dụng website"}". Vui lòng liên hệ Quản trị viên để được hỗ trợ.`,
        },
        { status: 403 }
      );
    }

    const isSuper = isSuperAdmin(user);
    const role = isSuper ? "superadmin" : (user.role || "user");
    const sessionToken = await createUserSessionToken(user.id, user.email, {
      name: user.name,
      avatar: user.avatar,
      role,
      isVerified: user.isVerified,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        role,
        createdAt: user.createdAt,
        isLocked: Boolean(user.isLocked),
        bannedUntil: user.bannedUntil || 0,
        banReason: user.banReason || "",
        bannedAt: user.bannedAt,
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

    // Single Sign-On: If Super Admin or Admin, automatically issue admin session cookie
    if (isSuper || role === "admin") {
      const adminToken = await createSessionToken(user.email || SUPER_ADMIN_EMAIL);
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: adminToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi đăng nhập" },
      { status: 500 }
    );
  }
}
