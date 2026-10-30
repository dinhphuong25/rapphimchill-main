"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, Check, Star, Clock, Calendar, Info, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import { getMovieImageCandidates, STATIC_BLUR_DATA_URL } from "@/lib/image-helper";

const HOVER_DELAY_MS = 400; // 0.4s hover delay as requested
const HIDE_GRACE_MS = 110;
const PREVIEW_WIDTH = 328;
const PREVIEW_ESTIMATED_HEIGHT = 385;

// In-memory cache for lazy-fetched movie details (synopsis, duration, categories, IMDb)
const previewDetailCache = new Map<string, any>();
const inflightRequests = new Map<string, Promise<any>>();

// Global active preview listener so only 1 card preview can ever be open at once
let activeCloseCallback: (() => void) | null = null;

function setGlobalActivePreview(closeFn: () => void) {
  if (activeCloseCallback && activeCloseCallback !== closeFn) {
    activeCloseCallback();
  }
  activeCloseCallback = closeFn;
}

async function fetchMovieDetailCached(slug: string): Promise<any | null> {
  if (!slug) return null;
  if (previewDetailCache.has(slug)) {
    return previewDetailCache.get(slug);
  }
  if (inflightRequests.has(slug)) {
    return inflightRequests.get(slug)!;
  }

  const promise = (async () => {
    try {
      const targetUrl = `https://phimapi.com/phim/${slug}`;
      const res = await fetch(`/api/phim?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const movieDetail = data?.movie || data?.data?.item || null;
      if (movieDetail && movieDetail.slug) {
        previewDetailCache.set(slug, movieDetail);
        return movieDetail;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflightRequests.delete(slug);
    }
  })();

  inflightRequests.set(slug, promise);
  return promise;
}

function getDeterministicRating(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  const normalized = (Math.abs(hash) % 14) / 10; // 0.0 to 1.3
  return (7.6 + normalized).toFixed(1);
}

function stripHtmlTags(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export interface QuickPreviewMovie {
  _id?: string;
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number | string;
  quality?: string;
  lang?: string;
  time?: string;
  episode_current?: string;
  content?: string;
  category?: { id?: string; name: string; slug?: string }[];
  imdb?: { rating?: number; vote_average?: number };
  tmdb?: { vote_average?: number };
  episodeIndex?: number;
  episodeName?: string;
  currentTime?: number;
  duration?: number;
}

export function useMovieQuickPreview(movie: QuickPreviewMovie | null | undefined) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [detailData, setDetailData] = useState<any | null>(() =>
    movie?.slug ? previewDetailCache.get(movie.slug) || null : null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeImmediately = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const canUseDesktopHover = () => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth >= 1024 &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  };

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return null;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const centeredLeft = rect.left + rect.width / 2 - PREVIEW_WIDTH / 2;
    const clampedLeft = Math.max(16, Math.min(vw - PREVIEW_WIDTH - 16, centeredLeft));

    const centeredTop = rect.top + rect.height / 2 - PREVIEW_ESTIMATED_HEIGHT / 2;
    const clampedTop = Math.max(16, Math.min(vh - PREVIEW_ESTIMATED_HEIGHT - 16, centeredTop));

    return { top: Math.round(clampedTop), left: Math.round(clampedLeft) };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!movie?.slug || !canUseDesktopHover()) return;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (isOpen) return;

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }

    showTimerRef.current = setTimeout(() => {
      const pos = computePosition();
      if (!pos) return;
      setGlobalActivePreview(closeImmediately);
      setCoords(pos);
      setIsOpen(true);

      // Lazy-fetch full details if synopsis, categories, or duration are missing
      const cached = previewDetailCache.get(movie.slug);
      if (cached) {
        setDetailData(cached);
      } else if (!movie.content || !movie.category?.length || !movie.time) {
        setLoadingDetail(true);
        fetchMovieDetailCached(movie.slug)
          .then((detail) => {
            if (detail) setDetailData(detail);
          })
          .finally(() => {
            setLoadingDetail(false);
          });
      }
    }, HOVER_DELAY_MS);
  }, [movie, isOpen, computePosition, closeImmediately]);

  const handleMouseLeave = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, HIDE_GRACE_MS);
  }, []);

  const handlePortalMouseEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      closeImmediately();
    };
    window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true } as any);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, closeImmediately]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (activeCloseCallback === closeImmediately) {
        activeCloseCallback = null;
      }
    };
  }, [closeImmediately]);

  return {
    triggerRef,
    isOpen,
    coords,
    detailData,
    loadingDetail,
    handleMouseEnter,
    handleMouseLeave,
    handlePortalMouseEnter,
    closeImmediately,
  };
}

interface MovieQuickPreviewPortalProps {
  movie: QuickPreviewMovie;
  detailData: any | null;
  loadingDetail: boolean;
  isOpen: boolean;
  coords: { top: number; left: number } | null;
  watchHref?: string;
  detailHref?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

export function MovieQuickPreviewPortal({
  movie,
  detailData,
  loadingDetail,
  isOpen,
  coords,
  watchHref,
  detailHref,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: MovieQuickPreviewPortalProps) {
  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [mounted, setMounted] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const merged = useMemo(() => {
    if (!detailData) return movie;
    return {
      ...movie,
      ...detailData,
      name: movie.name || detailData.name,
      origin_name: movie.origin_name || detailData.origin_name,
      thumb_url: movie.thumb_url || detailData.thumb_url,
      poster_url: movie.poster_url || detailData.poster_url,
      year: movie.year || detailData.year,
      quality: movie.quality || detailData.quality,
      lang: movie.lang || detailData.lang,
      time: movie.time || detailData.time,
      episode_current: movie.episode_current || detailData.episode_current,
      category:
        Array.isArray(movie.category) && movie.category.length > 0
          ? movie.category
          : Array.isArray(detailData.category)
          ? detailData.category
          : [],
      content: movie.content || detailData.content,
      imdb: movie.imdb?.rating ? movie.imdb : detailData.imdb || movie.imdb,
      tmdb: movie.tmdb?.vote_average ? movie.tmdb : detailData.tmdb || movie.tmdb,
    };
  }, [movie, detailData]);

  const backdropCandidates = useMemo(
    () => getMovieImageCandidates(merged, "backdrop"),
    [merged?.thumb_url, merged?.poster_url]
  );

  useEffect(() => {
    setImgIndex(0);
    setImgError(false);
  }, [movie?.slug]);

  if (!mounted || !isOpen || !coords || typeof document === "undefined") {
    return null;
  }

  const currentBackdrop =
    !imgError && backdropCandidates.length > 0 ? backdropCandidates[imgIndex] : null;

  const rawRating =
    merged.imdb?.rating ||
    (merged.imdb as any)?.vote_average ||
    merged.tmdb?.vote_average;
  const numericRating = Number(rawRating);
  const displayRating =
    !isNaN(numericRating) && numericRating > 0
      ? numericRating.toFixed(1)
      : getDeterministicRating(merged.slug);

  const displayYear = merged.year || "2025";
  const rawTime = merged.time?.trim();
  const displayDuration =
    rawTime && rawTime !== "Đang cập nhật" && rawTime !== "undefined"
      ? rawTime
      : merged.episode_current && merged.episode_current !== "Full"
      ? merged.episode_current
      : "Full HD";

  const categories: { name: string; slug?: string }[] = Array.isArray(merged.category)
    ? merged.category.slice(0, 3)
    : [];

  const cleanSynopsis = stripHtmlTags(merged.content);
  const isFav = isFavorite(merged.slug);

  const finalWatchHref = watchHref || `/watch?slug=${merged.slug}`;
  const finalDetailHref = detailHref || `/phim/${merged.slug}`;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!checkAuthOrPrompt("lưu phim vào tủ phim")) return;
    const willBeFav = !isFav;
    const updated = toggleFavorite({
      slug: merged.slug,
      name: merged.name,
      origin_name: merged.origin_name,
      thumb_url: currentBackdrop || merged.thumb_url || merged.poster_url || "",
      poster_url: merged.poster_url,
      year: typeof merged.year === "string" ? parseInt(merged.year, 10) : merged.year,
      quality: merged.quality,
      episode_current: merged.episode_current,
      tmdb: merged.tmdb,
      imdb: merged.imdb,
    });
    if (user && updated) {
      updateServerData({ favorites: updated });
    }
    if (willBeFav) {
      toast.success(`Đã thêm "${merged.name}" vào Tủ Phim!`);
    } else {
      toast.info(`Đã xóa "${merged.name}" khỏi Tủ Phim`);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${PREVIEW_WIDTH}px`,
        zIndex: 9990,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hidden lg:block select-none animate-in fade-in zoom-in-95 duration-200 ease-out"
    >
      <div className="rounded-2xl overflow-hidden bg-[#0b120e]/98 backdrop-blur-xl border border-brand-green/45 shadow-[0_24px_60px_rgba(0,0,0,0.92),0_0_32px_rgba(32,214,107,0.22)] text-left">
        {/* Top 16:9 Media Preview */}
        <Link
          href={finalWatchHref}
          onClick={onClose}
          className="relative block w-full aspect-[16/9] bg-cinema-surface overflow-hidden group/preview"
        >
          {currentBackdrop ? (
            <Image
              src={currentBackdrop}
              alt={merged.name}
              fill
              sizes="330px"
              quality={80}
              placeholder="blur"
              blurDataURL={STATIC_BLUR_DATA_URL}
              onError={() => {
                if (imgIndex + 1 < backdropCandidates.length) {
                  setImgIndex((i) => i + 1);
                } else {
                  setImgError(true);
                }
              }}
              className="object-cover scale-105 group-hover/preview:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-[#0d1612] flex items-center justify-center">
              <Film className="w-8 h-8 text-brand-green/60" />
            </div>
          )}

          {/* Cinema Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b120e] via-[#0b120e]/25 to-black/30" />

          {/* Top Left Quality & Lang Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-brand-green text-cinema-bg shadow-sm">
              {merged.quality || "FHD"}
            </span>
            {merged.lang && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/80 text-white border border-white/15 backdrop-blur-md">
                {merged.lang.includes("Thuyết")
                  ? "Thuyết Minh"
                  : merged.lang.includes("Lồng")
                  ? "Lồng Tiếng"
                  : "Vietsub"}
              </span>
            )}
          </div>

          {/* Top Right Episode Status Badge */}
          {merged.episode_current && (
            <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-brand-green border border-brand-green/35 backdrop-blur-md">
              {merged.episode_current}
            </span>
          )}

          {/* Subtle Center Play Pulse */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 bg-black/25">
            <div className="w-11 h-11 rounded-full bg-brand-green/95 flex items-center justify-center text-cinema-bg shadow-[0_0_20px_rgba(32,214,107,0.7)]">
              <Play className="w-5 h-5 fill-cinema-bg ml-0.5" />
            </div>
          </div>
        </Link>

        {/* Body Content */}
        <div className="p-3.5 pt-2.5 space-y-2.5">
          {/* Title & Origin Name */}
          <div>
            <Link
              href={finalDetailHref}
              onClick={onClose}
              className="text-sm font-black text-white hover:text-brand-green transition-colors line-clamp-1 block leading-snug"
            >
              {merged.name}
            </Link>
            {merged.origin_name && (
              <p className="text-[11px] text-white/50 font-medium line-clamp-1 mt-0.5">
                {merged.origin_name}
              </p>
            )}
          </div>

          {/* Action Buttons: "Xem Ngay" + "+ Tủ Phim" + "Chi Tiết" */}
          <div className="flex items-center gap-2 pt-0.5">
            <Link
              href={finalWatchHref}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-green hover:bg-[#1bc25f] text-cinema-bg font-extrabold text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(32,214,107,0.35)] transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-cinema-bg" />
              <span>Xem Ngay</span>
            </Link>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer",
                isFav
                  ? "bg-brand-green/15 border-brand-green/50 text-brand-green"
                  : "bg-white/[0.07] hover:bg-white/[0.13] border-white/15 text-white"
              )}
            >
              {isFav ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
                  <span>Đã Lưu</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
                  <span>Tủ Phim</span>
                </>
              )}
            </button>

            <Link
              href={finalDetailHref}
              onClick={onClose}
              title="Xem chi tiết phim"
              aria-label="Xem chi tiết phim"
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white/75 hover:text-white transition-all active:scale-95"
            >
              <Info className="w-4 h-4" />
            </Link>
          </div>

          {/* Metadata Row: Điểm IMDb • Năm • Thời lượng */}
          <div className="flex items-center flex-wrap gap-1.5 pt-0.5 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-cinema-gold font-bold">
              <Star className="w-3 h-3 fill-cinema-gold" />
              <span>IMDb {displayRating}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-white/85 font-semibold">
              <Calendar className="w-3 h-3 text-brand-green" />
              <span>{displayYear}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-white/85 font-semibold truncate max-w-[130px]">
              <Clock className="w-3 h-3 text-brand-green shrink-0" />
              <span className="truncate">{displayDuration}</span>
            </span>
          </div>

          {/* Genres (Thể loại) */}
          {categories.length > 0 ? (
            <div className="flex items-center flex-wrap gap-1.5">
              {categories.map((cat, idx) => (
                <span
                  key={cat.slug || idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-brand-green/25 text-[10px] font-semibold text-brand-green/90"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-14 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
            </div>
          ) : null}

          {/* Short Synopsis (Tóm tắt ngắn) */}
          {cleanSynopsis ? (
            <p className="text-[11px] text-white/65 leading-relaxed line-clamp-3 border-t border-white/[0.07] pt-2">
              {cleanSynopsis}
            </p>
          ) : loadingDetail ? (
            <div className="space-y-1.5 border-t border-white/[0.07] pt-2">
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-white/5 animate-pulse" />
            </div>
          ) : (
            <p className="text-[11px] text-white/50 italic border-t border-white/[0.07] pt-2 line-clamp-2">
              Thưởng thức {merged.name} ({displayYear}) chất lượng {merged.quality || "Full HD"} tốc độ cao tại Hi Phim.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
