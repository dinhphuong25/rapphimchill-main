import fs from "fs";
import path from "path";

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");
const PENDING_FILE_PATH = path.join(process.cwd(), "data", "pending-registrations.json");

export const SUPER_ADMIN_EMAIL = "kimdinhphuong205@gmail.com";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  role?: "user" | "vip" | "admin" | "superadmin";
  createdAt: string;
  lastActiveAt?: string;
  isLocked?: boolean;
  bannedUntil?: number; // timestamp in ms, or -1 for permanent
  banReason?: string;
  bannedAt?: string;
}

export interface User extends UserProfile {
  passwordHash: string;
  updatedAt: string;
  favorites: any[];
  history: any[];
}

interface PendingRegistration {
  email: string;
  passwordHash: string;
  name: string;
  otp: string;
  expiresAt: number;
}

function ensureDirectory() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readUsers(): User[] {
  try {
    ensureDirectory();
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error("Error reading users.json:", err);
  }
  return [];
}

function writeUsers(users: User[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users.json:", err);
  }
}

function readPending(): PendingRegistration[] {
  try {
    ensureDirectory();
    if (fs.existsSync(PENDING_FILE_PATH)) {
      const data = fs.readFileSync(PENDING_FILE_PATH, "utf-8");
      const list: PendingRegistration[] = JSON.parse(data) || [];
      // Clean expired
      return list.filter((p) => p.expiresAt > Date.now());
    }
  } catch (err) {
    console.error("Error reading pending-registrations.json:", err);
  }
  return [];
}

function writePending(list: PendingRegistration[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(PENDING_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing pending-registrations.json:", err);
  }
}

/**
 * PBKDF2 Password Hashing (Zero external dependency, 100% web crypto)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  const hashHex = Array.from(new Uint8Array(exported)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, expectedHash] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  const computedHash = Array.from(new Uint8Array(exported)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === expectedHash;
}

export function isSuperAdmin(emailOrUser: string | UserProfile | User | null | undefined): boolean {
  if (!emailOrUser) return false;
  if (typeof emailOrUser === "string") {
    return emailOrUser.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
  if (emailOrUser.email && emailOrUser.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return emailOrUser.role === "superadmin";
}

export function findUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return null;
  if (isSuperAdmin(user.email)) {
    user.role = "superadmin";
  }
  return user;
}

export function findUserById(id: string): User | null {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  if (isSuperAdmin(user.email)) {
    user.role = "superadmin";
  }
  return user;
}

export interface CurrentWatchingInfo {
  slug: string;
  name: string;
  origin_name?: string;
  episodeName?: string;
  episodeIndex?: number;
  currentTime: number;
  duration: number;
  watchedAt: number;
}

export interface UserAdminDetail extends UserProfile {
  favoritesCount: number;
  historyCount: number;
  currentWatching?: CurrentWatchingInfo | null;
  favorites?: any[];
  history?: any[];
}

export function touchUserActivity(userId: string): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].lastActiveAt = new Date().toISOString();
  writeUsers(users);
}

export function banUser(
  userId: string,
  durationHours: number | "permanent",
  reason: string
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể khóa tài khoản Super Admin!" };
  }

  const now = Date.now();
  const isPermanent = durationHours === "permanent";
  const bannedUntil = isPermanent ? -1 : now + Number(durationHours) * 60 * 60 * 1000;

  const updated = updateUser(userId, {
    isLocked: isPermanent,
    bannedUntil,
    banReason: reason.trim() || (isPermanent ? "Vi phạm quy định hệ thống" : "Tạm khóa quyền xem phim"),
    bannedAt: new Date().toISOString(),
  });

  return { success: true, user: updated || undefined };
}

export function unbanUser(userId: string): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, {
    isLocked: false,
    bannedUntil: 0,
    banReason: "",
    bannedAt: undefined,
  });

  return { success: true, user: updated || undefined };
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể xóa tài khoản Super Admin!" };
  }

  const users = readUsers().filter((u) => u.id !== userId);
  writeUsers(users);
  return { success: true };
}

export function changeUserRole(
  userId: string,
  newRole: "user" | "admin" | "vip"
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể thay đổi vai trò của Super Admin tối cao!" };
  }

  const updated = updateUser(userId, { role: newRole });
  return { success: true, user: updated || undefined };
}

export function setUserVerified(
  userId: string,
  isVerified: boolean
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, { isVerified });
  return { success: true, user: updated || undefined };
}

export function clearUserWatching(
  userId: string
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, { history: [] });
  return { success: true, user: updated || undefined };
}

export async function adminResetPassword(
  userId: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (newPasswordPlain.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  const newHash = await hashPassword(newPasswordPlain);
  updateUser(userId, { passwordHash: newHash });
  return { success: true };
}

export function getAllUsersForAdmin(): UserAdminDetail[] {
  const users = readUsers();
  return users.map((u) => {
    const isSuper = isSuperAdmin(u.email);

    // Compute current watching (most recent history entry)
    let currentWatching: CurrentWatchingInfo | null = null;
    if (Array.isArray(u.history) && u.history.length > 0) {
      const sorted = [...u.history].sort((a, b) => (Number(b.watchedAt) || 0) - (Number(a.watchedAt) || 0));
      const latest = sorted[0];
      if (latest && latest.slug) {
        currentWatching = {
          slug: latest.slug,
          name: latest.name || latest.slug,
          origin_name: latest.origin_name,
          episodeName: latest.episodeName || (typeof latest.episodeIndex === "number" ? `Tập ${latest.episodeIndex + 1}` : latest.episode_current),
          episodeIndex: latest.episodeIndex,
          currentTime: Number(latest.currentTime) || 0,
          duration: Number(latest.duration) || 0,
          watchedAt: Number(latest.watchedAt) || 0,
        };
      }
    }

    // Check if temporary ban has expired
    let isLocked = Boolean(u.isLocked);
    let bannedUntil = u.bannedUntil;
    let banReason = u.banReason;
    if (bannedUntil && bannedUntil > 0 && bannedUntil <= Date.now()) {
      isLocked = false;
      bannedUntil = 0;
      banReason = "";
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar || "",
      isVerified: u.isVerified,
      role: isSuper ? "superadmin" : (u.role || "user"),
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt || u.updatedAt || u.createdAt,
      isLocked,
      bannedUntil,
      banReason,
      bannedAt: u.bannedAt,
      favoritesCount: (u.favorites || []).length,
      historyCount: (u.history || []).length,
      currentWatching,
      favorites: u.favorites || [],
      history: (u.history || []).slice(0, 50),
    };
  });
}

export function savePendingRegistration(email: string, passwordHash: string, name: string, otp: string): void {
  const normalized = email.trim().toLowerCase();
  const pending = readPending().filter((p) => p.email.toLowerCase() !== normalized);
  pending.push({
    email: normalized,
    passwordHash,
    name: name.trim() || normalized.split("@")[0],
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  writePending(pending);
}

export function getPendingRegistration(email: string): PendingRegistration | null {
  const normalized = email.trim().toLowerCase();
  const pending = readPending();
  return pending.find((p) => p.email.toLowerCase() === normalized) || null;
}

export function verifyAndCreateUser(email: string, otp: string): { user?: User; error?: string } {
  const normalized = email.trim().toLowerCase();
  const pendingList = readPending();
  const index = pendingList.findIndex((p) => p.email.toLowerCase() === normalized);

  if (index === -1) {
    return { error: "Không tìm thấy yêu cầu đăng ký hoặc mã đã hết hạn. Vui lòng đăng ký lại." };
  }

  const pending = pendingList[index];
  if (pending.otp !== otp.trim()) {
    return { error: "Mã xác thực OTP không chính xác. Vui lòng thử lại." };
  }

  // Check if user already exists
  if (findUserByEmail(normalized)) {
    return { error: "Email này đã được kích hoạt tài khoản trước đó. Vui lòng đăng nhập." };
  }

  // Create active user
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: normalized,
    name: pending.name,
    passwordHash: pending.passwordHash,
    avatar: "",
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorites: [],
    history: [],
  };

  const users = readUsers();
  users.push(newUser);
  writeUsers(users);

  // Remove from pending
  pendingList.splice(index, 1);
  writePending(pendingList);

  return { user: newUser };
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  return users[idx];
}

export function syncUserData(
  userId: string,
  localFavorites?: any[],
  localHistory?: any[],
  mode: "merge" | "replace" = "merge"
): { favorites: any[]; history: any[] } {
  const user = findUserById(userId);
  if (!user) return { favorites: localFavorites || [], history: localHistory || [] };

  let mergedFavorites: any[] = user.favorites || [];
  let mergedHistory: any[] = user.history || [];

  if (mode === "replace") {
    if (Array.isArray(localFavorites)) {
      mergedFavorites = localFavorites;
    }
    if (Array.isArray(localHistory)) {
      mergedHistory = localHistory;
    }
  } else {
    // Mode "merge" (used on initial login or auto-sync)
    if (Array.isArray(localFavorites) && localFavorites.length > 0) {
      const favMap = new Map<string, any>();
      (user.favorites || []).forEach((f) => {
        if (f?.slug) favMap.set(f.slug, f);
      });
      localFavorites.forEach((f) => {
        if (f?.slug) favMap.set(f.slug, f);
      });
      mergedFavorites = Array.from(favMap.values());
    }

    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const historyMap = new Map<string, any>();
      [...(user.history || []), ...localHistory].forEach((h) => {
        if (h?.slug) {
          const existing = historyMap.get(h.slug);
          const newTime = h.watchedAt || h.timestamp || 0;
          const existTime = existing ? (existing.watchedAt || existing.timestamp || 0) : 0;
          if (!existing || newTime > existTime) {
            historyMap.set(h.slug, h);
          }
        }
      });
      mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
        const timeA = a.watchedAt || a.timestamp || 0;
        const timeB = b.watchedAt || b.timestamp || 0;
        return timeB - timeA;
      });
    }
  }

  // Save to database
  updateUser(userId, {
    favorites: mergedFavorites,
    history: mergedHistory,
  });

  return { favorites: mergedFavorites, history: mergedHistory };
}

