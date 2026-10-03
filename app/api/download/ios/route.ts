import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IOS_IPA_URL =
  "https://expo.dev/artifacts/eas/BviAc4LJrwRZNIvfoPGlQHYNoALct4cVIyCIGcNnEbc.ipa";

export async function GET() {
  try {
    const upstream = await fetch(IOS_IPA_URL);

    if (!upstream.ok || !upstream.body) {
      return NextResponse.redirect(IOS_IPA_URL);
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", 'attachment; filename="hiphim.ipa"');

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body as any, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.redirect(IOS_IPA_URL);
  }
}
