export const STATIC_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23111714'/%3E%3C/svg%3E";

export const PLACEHOLDER_POSTER = "/placeholder.svg";

/**
 * Normalizes any movie image path into a full, valid HTTPS URL.
 * Prevents invalid concatenations like https://phimimg.com/danviet.vn/...
 */
export function normalizeImageUrl(
  rawUrl?: string | null,
  cdnDomain = "https://phimimg.com"
): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";

  // Already a full protocol URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  // Protocol relative
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // If path starts with an external domain name without protocol (e.g., danviet.vn/files/...)
  const firstSegment = trimmed.split("/")[0];
  if (
    !trimmed.startsWith("upload") &&
    !trimmed.startsWith("/upload") &&
    firstSegment &&
    firstSegment.includes(".") &&
    !firstSegment.endsWith(".webp") &&
    !firstSegment.endsWith(".jpg") &&
    !firstSegment.endsWith(".png")
  ) {
    return `https://${trimmed}`;
  }

  // Relative CDN path (uploads/... or upload/...)
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${cdnDomain}/${cleanPath}`;
}

/**
 * Tối ưu hóa ảnh phim: Chuyển đổi sang WebP nén siêu nhẹ (từ 1.35MB -> 15KB)
 * qua CDN toàn cầu WordPress Photon với thời gian cache 2 năm tại Edge.
 */
export function getOptimizedImageUrl(
  url: string,
  type: "poster" | "backdrop" | "thumb" = "poster"
): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:") || url.endsWith(".svg") || url.includes(".wp.com")) {
    return url;
  }

  const isCdn = url.includes("phimimg.com") || url.includes("ophim");
  if (!isCdn) return url;

  const width = type === "poster" ? 360 : type === "thumb" ? 220 : 1080;
  const cleanUrl = url.replace(/^https?:\/\//i, "");
  const hash = cleanUrl.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shard = hash % 3;
  return `https://i${shard}.wp.com/${cleanUrl}?w=${width}&strip=all`;
}

/**
 * Returns prioritized list of candidate URLs for a movie image.
 * In PhimApi / KKPhim / OPhim:
 * - poster_url is the portrait 2:3 vertical poster (e.g., 600x900, 1000x1500)
 * - thumb_url is the landscape 16:9 widescreen backdrop/thumbnail (e.g., 1280x720, 3840x2160)
 *
 * For type="poster": prioritize poster_url, fallback to thumb_url.
 * For type="backdrop": prioritize thumb_url, fallback to poster_url.
 */
export function getMovieImageCandidates(
  movie?: { thumb_url?: string | null; poster_url?: string | null } | null,
  type: "poster" | "backdrop" | "thumb" = "poster"
): string[] {
  if (!movie) return [];

  const isPoster = type === "poster";

  const pStr = (movie.poster_url || "").toLowerCase();
  const tStr = (movie.thumb_url || "").toLowerCase();

  let primaryRaw = isPoster ? movie.poster_url : movie.thumb_url;
  let secondaryRaw = isPoster ? movie.thumb_url : movie.poster_url;

  if (isPoster) {
    if (tStr.includes("poster") && !pStr.includes("poster")) {
      primaryRaw = movie.thumb_url;
      secondaryRaw = movie.poster_url;
    }
  } else {
    if (pStr.includes("thumb") && !tStr.includes("thumb")) {
      primaryRaw = movie.poster_url;
      secondaryRaw = movie.thumb_url;
    }
  }

  const rawCandidates = [primaryRaw, secondaryRaw];
  const candidates: string[] = [];

  for (const raw of rawCandidates) {
    const normalized = normalizeImageUrl(raw);
    if (normalized && !candidates.includes(normalized)) {
      // If it's a known blocked external domain (e.g. danviet.vn), put at back
      if (normalized.includes("danviet.vn") || normalized.includes("i.ex-cdn.com")) {
        continue;
      }

      // Ưu tiên bản WebP tối ưu kích thước siêu nhẹ trước
      const optimized = getOptimizedImageUrl(normalized, type);
      if (optimized && optimized !== normalized && !candidates.includes(optimized)) {
        candidates.push(optimized);
      }

      candidates.push(normalized);

      // Add mirror CDN fallback ONLY for known ophim domains that share identical paths
      if (normalized.includes("img.ophim1.com/")) {
        const mirror = normalized.replace("img.ophim1.com", "img.ophim.live");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      } else if (normalized.includes("img.ophim.live/")) {
        const mirror = normalized.replace("img.ophim.live", "img.ophim1.com");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      }
    }
  }

  // Append external suspicious URLs at the very end only if no other candidate exists
  for (const raw of rawCandidates) {
    const normalized = normalizeImageUrl(raw);
    if (
      normalized &&
      !candidates.includes(normalized) &&
      (normalized.includes("danviet.vn") || normalized.includes("i.ex-cdn.com"))
    ) {
      candidates.push(normalized);
    }
  }

  return candidates;
}
