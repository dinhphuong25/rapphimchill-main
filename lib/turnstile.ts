/**
 * Cloudflare Turnstile Verification Helper
 * Verifies Turnstile tokens server-side with Cloudflare Siteverify API.
 */

// Cloudflare dummy secret key for testing (always passes).
// In production, configure TURNSTILE_SECRET_KEY in Cloudflare Worker secrets or wrangler.jsonc.
const DEFAULT_TURNSTILE_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  // If no token provided
  if (!token || typeof token !== "string" || !token.trim()) {
    // In development mode, allow bypassing if Turnstile is disabled
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return {
      success: false,
      error: "Vui lòng hoàn tất xác thực chống bot Cloudflare Turnstile.",
    };
  }

  const secretKey =
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    (globalThis as any)?.__ENV__?.TURNSTILE_SECRET_KEY?.trim() ||
    DEFAULT_TURNSTILE_SECRET;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp && remoteIp !== "unknown" && remoteIp !== "127.0.0.1") {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      console.warn("[TURNSTILE] Siteverify returned non-OK status:", res.status);
      return { success: true }; // Graceful degradation so users aren't locked out if Cloudflare has network glitch
    }

    const outcome = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    if (outcome.success) {
      return { success: true };
    }

    console.warn("[TURNSTILE] Verification rejected:", outcome["error-codes"]);
    return {
      success: false,
      error: "Xác thực bảo vệ Cloudflare không thành công. Vui lòng thử lại.",
    };
  } catch (err) {
    console.error("[TURNSTILE] Error verifying token:", err);
    // Graceful degradation
    return { success: true };
  }
}
