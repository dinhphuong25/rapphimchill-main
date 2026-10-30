import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Trang đăng nhập Admin trực tiếp đã được vô hiệu hóa để bảo mật. Vui lòng đăng nhập tài khoản trên trang chủ.",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
