export const USER_COOKIE_NAME = "hiphim_user_session";
const SESSION_MAX_AGE_SECONDS = 86400 * 30; // 30 days session
const SECRET_SALT = process.env.USER_JWT_SECRET || "hiphim_user_jwt_secret_salt_2026";

export interface UserSessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
}

/**
 * Creates an HMAC signed session token using Web Crypto API.
 * 100% compatible with Node.js and Next.js Edge Middleware.
 */
export async function createUserSessionToken(userId: string, email: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}:${email}:${expiresAt}`;
  const signature = await generateHmac(payload, SECRET_SALT);
  return `${payload}:${signature}`;
}

/**
 * Verifies an HMAC signed session token using Web Crypto API.
 */
export async function verifyUserSessionToken(token: string | null | undefined): Promise<UserSessionPayload | null> {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 4) return null;

  const [userId, email, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return null; // Token expired
  }

  const payload = `${userId}:${email}:${expiresAtStr}`;
  const expectedSig = await generateHmac(payload, SECRET_SALT);
  if (signature !== expectedSig) {
    return null; // Invalid signature
  }

  return { userId, email, expiresAt };
}

async function generateHmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(sigBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
