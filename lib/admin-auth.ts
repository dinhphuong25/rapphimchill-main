import fs from "fs";
import path from "path";
export { createSessionToken, verifySessionToken, ADMIN_COOKIE_NAME } from "./admin-token";

const AUTH_FILE_PATH = path.join(process.cwd(), "data", "admin-auth.json");

const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "hiphim_admin_2026";

interface AuthStore {
  username: string;
  passwordHash: string;
  updatedAt: string;
}

function getStoredAuth(): { username: string; password: string } {
  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
      if (data.username && data.passwordHash) {
        return { username: data.username, password: data.passwordHash };
      }
    }
  } catch (err) {
    console.warn("Could not read admin-auth.json, using default credentials:", err);
  }
  return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
}

export function updateAdminPassword(newPassword: string, newUsername?: string): boolean {
  try {
    const current = getStoredAuth();
    const updated: AuthStore = {
      username: newUsername || current.username,
      passwordHash: newPassword,
      updatedAt: new Date().toISOString(),
    };
    const dir = path.dirname(AUTH_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Could not write admin-auth.json:", err);
    return false;
  }
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const current = getStoredAuth();
  return (
    username.trim().toLowerCase() === current.username.toLowerCase() &&
    password.trim() === current.password
  );
}
