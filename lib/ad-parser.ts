export interface AdRange {
  start: number;
  end: number;
  duration: number;
}

// In-memory cache for parsed m3u8 ad ranges to prevent re-fetching
const adRangesCache = new Map<string, AdRange[]>();

/**
 * Checks whether a given segment URL/filename matches known third-party casino/gambling ad patterns.
 */
export function isAdSegment(url: string, duration?: number): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();

  // 1. Specific paths used by pirate syndicates (KKPhim, Ophim, NguonC, etc.)
  if (lower.includes('convertv8')) return true;
  if (lower.includes('/v8/')) return true;
  if (lower.includes('segment_') && (duration === undefined || duration < 8)) return true;

  // 2. Generic commercial keywords
  if (lower.includes('advert') || lower.includes('banner_ad') || lower.includes('/ad/') || lower.includes('quangcao')) {
    return true;
  }

  // 3. Known casino sponsor subdomains or filenames
  if (lower.includes('9922') || lower.includes('okvip') || lower.includes('shbet') || lower.includes('789bet')) {
    return true;
  }

  return false;
}

/**
 * Parses ad ranges from m3u8 playlist text.
 */
export function parseAdRangesFromM3U8Text(m3u8Text: string): AdRange[] {
  if (!m3u8Text) return [];

  const lines = m3u8Text.split('\n');
  const segments: Array<{ start: number; end: number; dur: number; seg: string; isDiscontinuity: boolean }> = [];
  let currentSec = 0;
  let isAfterDiscontinuity = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '#EXT-X-DISCONTINUITY') {
      isAfterDiscontinuity = true;
    } else if (line.startsWith('#EXTINF:')) {
      const dur = parseFloat(line.substring(8));
      let seg = '';
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next && !next.startsWith('#')) {
          seg = next;
          break;
        }
      }
      if (!isNaN(dur) && dur > 0) {
        segments.push({
          start: currentSec,
          end: currentSec + dur,
          dur,
          seg,
          isDiscontinuity: isAfterDiscontinuity,
        });
        currentSec += dur;
      }
      isAfterDiscontinuity = false;
    }
  }

  const adRanges: AdRange[] = [];
  let inAd = false;
  let adStart = 0;
  let adEnd = 0;

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const isAd = isAdSegment(s.seg, s.dur);

    if (isAd) {
      if (!inAd) {
        inAd = true;
        adStart = s.start;
      }
      adEnd = s.end;
    } else {
      if (inAd) {
        inAd = false;
        const dur = adEnd - adStart;
        if (dur >= 4 && dur <= 90) {
          adRanges.push({ start: adStart, end: adEnd, duration: dur });
        }
      }
    }
  }

  if (inAd) {
    const dur = adEnd - adStart;
    if (dur >= 4 && dur <= 90) {
      adRanges.push({ start: adStart, end: adEnd, duration: dur });
    }
  }

  return adRanges;
}

/**
 * Extracts ad ranges directly from Hls.js fragment objects (zero network latency).
 */
export function extractAdRangesFromFragments(fragments: any[]): AdRange[] {
  if (!Array.isArray(fragments) || fragments.length === 0) return [];

  const adRanges: AdRange[] = [];
  let inAd = false;
  let adStart = 0;
  let adEnd = 0;

  for (let i = 0; i < fragments.length; i++) {
    const f = fragments[i];
    const url = f.relurl || f.url || '';
    const dur = f.duration || 0;
    const isAd = isAdSegment(url, dur);

    if (isAd) {
      if (!inAd) {
        inAd = true;
        adStart = f.start;
      }
      adEnd = f.start + dur;
    } else {
      if (inAd) {
        inAd = false;
        const duration = adEnd - adStart;
        if (duration >= 4 && duration <= 90) {
          adRanges.push({ start: adStart, end: adEnd, duration });
        }
      }
    }
  }

  if (inAd) {
    const duration = adEnd - adStart;
    if (duration >= 4 && duration <= 90) {
      adRanges.push({ start: adStart, end: adEnd, duration });
    }
  }

  return adRanges;
}

/**
 * Fetches and parses an m3u8 playlist URL, resolving master playlists if necessary.
 */
export async function fetchAndParseAdRanges(videoUrl: string): Promise<AdRange[]> {
  if (!videoUrl || !videoUrl.includes('.m3u8')) return [];

  if (adRangesCache.has(videoUrl)) {
    return adRangesCache.get(videoUrl)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(videoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const text = await res.text();
    let targetText = text;

    // Check if master playlist contains sub-playlists
    if (text.includes('#EXT-X-STREAM-INF')) {
      const lines = text.split('\n');
      const streamLine = lines.find(
        (l) => l.trim().endsWith('.m3u8') || (!l.startsWith('#') && l.trim().length > 0)
      );
      if (streamLine) {
        try {
          const targetUrl = new URL(streamLine.trim(), videoUrl).href;
          const subRes = await fetch(targetUrl);
          if (subRes.ok) {
            targetText = await subRes.text();
          }
        } catch {}
      }
    }

    const ranges = parseAdRangesFromM3U8Text(targetText);
    adRangesCache.set(videoUrl, ranges);
    return ranges;
  } catch {
    return [];
  }
}
