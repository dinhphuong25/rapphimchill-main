"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Film, Home, RefreshCw, Search, ArrowLeft } from "lucide-react";
import MovieDetailView from "@/components/movie/movie-detail-view";
import Description from "@/components/movie/description";
import { LoadingWatch } from "@/components/ui/page-loaders";
import { normalizeImageUrl } from "@/lib/image-helper";

export interface RescuedMovieData {
  movie: any;
  episodes: any[];
}

function normalizeTitleForMatch(str: string | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function hasAnyM3u8Stream(episodes: any[]): boolean {
  if (!Array.isArray(episodes)) return false;
  return episodes.some(
    (s: any) =>
      Array.isArray(s?.server_data) &&
      s.server_data.some((ep: any) => {
        const m3u8 = ep?.link_m3u8?.trim() || "";
        const embed = ep?.link_embed?.trim() || "";
        return m3u8 !== "" || embed.includes(".m3u8");
      })
  );
}

export function injectM3u8IntoServers(targetServers: any[], m3u8Servers: any[]): any[] {
  if (!Array.isArray(m3u8Servers) || m3u8Servers.length === 0) return targetServers || [];
  if (!Array.isArray(targetServers) || targetServers.length === 0) return m3u8Servers;

  const primaryEpList = m3u8Servers[0]?.server_data || [];
  if (primaryEpList.length === 0) return targetServers;

  return targetServers.map((server: any, sIdx: number) => {
    const donorEpList = m3u8Servers[sIdx]?.server_data || primaryEpList;
    const updatedData = (server?.server_data || []).map((ep: any, epIdx: number) => {
      if (ep?.link_m3u8 && ep.link_m3u8.trim() !== "") return ep;
      const matchedDonor =
        donorEpList[epIdx] ||
        donorEpList.find((d: any) => d?.slug === ep?.slug) ||
        donorEpList[0];
      if (matchedDonor?.link_m3u8) {
        return {
          ...ep,
          link_m3u8: matchedDonor.link_m3u8,
        };
      }
      return ep;
    });
    return {
      ...server,
      server_data: updatedData,
    };
  });
}

/**
 * Fetches primary movie & m3u8 streams directly from the user's browser to phimapi.com.
 * Because phimapi.com sets Access-Control-Allow-Origin: *, residential/4G client IPs
 * bypass Cloudflare Worker datacenter rate-limits completely.
 */
export async function fetchPrimaryPhimApiClient(
  slug: string,
  movieName?: string,
  originName?: string
): Promise<RescuedMovieData | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) return null;

  // 1. Direct slug lookup on phimapi.com
  try {
    const directRes = await fetch(`https://phimapi.com/phim/${cleanSlug}`);
    if (directRes.ok) {
      const data = await directRes.json();
      const episodes = data?.episodes || data?.server || [];
      if (data?.movie?.slug && hasAnyM3u8Stream(episodes)) {
        return {
          movie: {
            ...data.movie,
            thumb_url: normalizeImageUrl(data.movie.thumb_url),
            poster_url: normalizeImageUrl(data.movie.poster_url),
          },
          episodes,
        };
      }
    }
  } catch {}

  // 2. If slug differed (e.g. NguonC slug), search phimapi.com by movie name / origin_name
  const keywords = [movieName, originName, cleanSlug.replace(/-/g, " ")].filter(
    (k, i, arr) => Boolean(k && k.trim()) && arr.indexOf(k) === i
  ) as string[];

  for (const kw of keywords) {
    try {
      const searchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw.trim())}&limit=5`;
      const sRes = await fetch(searchUrl);
      if (!sRes.ok) continue;
      const sData = await sRes.json();
      const items: any[] = sData?.data?.items || sData?.items || [];
      if (!Array.isArray(items) || items.length === 0) continue;

      const normName = normalizeTitleForMatch(movieName);
      const normOrigin = normalizeTitleForMatch(originName);

      const matched =
        items.find((it: any) => {
          const itName = normalizeTitleForMatch(it?.name);
          const itOrigin = normalizeTitleForMatch(it?.origin_name);
          return (
            it?.slug === cleanSlug ||
            (normName && (itName === normName || itOrigin === normName)) ||
            (normOrigin && (itOrigin === normOrigin || itName === normOrigin))
          );
        }) || items[0];

      if (matched?.slug) {
        const detailRes = await fetch(`https://phimapi.com/phim/${matched.slug}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const episodes = detailData?.episodes || detailData?.server || [];
          if (detailData?.movie?.slug && hasAnyM3u8Stream(episodes)) {
            return {
              movie: {
                ...detailData.movie,
                thumb_url: normalizeImageUrl(detailData.movie.thumb_url),
                poster_url: normalizeImageUrl(detailData.movie.poster_url),
              },
              episodes,
            };
          }
        }
      }
    } catch {}
  }

  return null;
}

export async function fetchMovieClientSide(slug: string): Promise<RescuedMovieData | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) return null;

  // 1. PRIORITY #1: Direct browser fetch from phimapi.com (residential/4G IP, always returns m3u8 Default Player)
  const primaryDirect = await fetchPrimaryPhimApiClient(cleanSlug);
  if (primaryDirect) {
    return primaryDirect;
  }

  let fallbackCandidate: RescuedMovieData | null = null;

  // 2. Try internal Edge proxy (/api/phim)
  try {
    const proxyUrl = `/api/phim?url=${encodeURIComponent(`https://phimapi.com/phim/${cleanSlug}`)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.movie?.slug) {
        const episodes = data.episodes || data.server || [];
        const candidate: RescuedMovieData = {
          movie: {
            ...data.movie,
            thumb_url: normalizeImageUrl(data.movie.thumb_url),
            poster_url: normalizeImageUrl(data.movie.poster_url),
          },
          episodes,
        };
        if (hasAnyM3u8Stream(episodes)) {
          return candidate;
        }
        fallbackCandidate = candidate;
      }
    }
  } catch {}

  // 3. Direct browser fetch from NguonC fallback
  if (!fallbackCandidate) {
    try {
      const fbRes = await fetch(`https://phim.nguonc.com/api/film/${cleanSlug}`);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const fbMovie = fbData?.movie;
        if (fbMovie && fbMovie.slug) {
          const mappedMovie = {
            name: fbMovie.name,
            slug: fbMovie.slug,
            origin_name: fbMovie.original_name,
            content: fbMovie.description,
            thumb_url: normalizeImageUrl(fbMovie.poster_url || fbMovie.thumb_url),
            poster_url: normalizeImageUrl(fbMovie.thumb_url || fbMovie.poster_url),
            year: fbMovie.created ? new Date(fbMovie.created).getFullYear() : 2026,
            episode_current: fbMovie.current_episode,
            quality: fbMovie.quality || "HD",
            lang: fbMovie.language || "Vietsub",
          };
          const mappedEpisodes = (fbMovie.episodes || []).map((s: any, idx: number) => ({
            server_name: s.server_name ? `Dự Phòng (${s.server_name})` : `Dự Phòng ${idx > 0 ? idx + 1 : ""}`.trim(),
            server_data: (s.items || []).map((it: any) => ({
              name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
              slug: it.slug,
              filename: it.name,
              link_embed: it.embed,
              link_m3u8: "",
            })),
          }));
          fallbackCandidate = {
            movie: mappedMovie,
            episodes: mappedEpisodes,
          };
        }
      }
    } catch {}
  }

  // 4. If we got a NguonC fallback (which lacks m3u8), resolve m3u8 from phimapi.com by movie name so it uses the Default Player UI!
  if (fallbackCandidate) {
    const resolvedByTitle = await fetchPrimaryPhimApiClient(
      cleanSlug,
      fallbackCandidate.movie?.name,
      fallbackCandidate.movie?.origin_name
    );
    if (resolvedByTitle && hasAnyM3u8Stream(resolvedByTitle.episodes)) {
      return {
        movie: {
          ...fallbackCandidate.movie,
          ...resolvedByTitle.movie,
          slug: fallbackCandidate.movie.slug || cleanSlug,
        },
        episodes: injectM3u8IntoServers(resolvedByTitle.episodes, resolvedByTitle.episodes),
      };
    }
    return fallbackCandidate;
  }

  return null;
}

export function TrueNotFoundCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[82vh] w-full flex items-center justify-center bg-[#060908] overflow-hidden relative px-4 pt-8 pb-36 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-green/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-[#0e1512] border border-brand-green/30 rounded-full flex items-center justify-center shadow-2xl">
            <Film className="w-9 h-9 text-brand-green" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="text-7xl sm:text-8xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/85 to-white/20 mb-3">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2.5 tracking-tight">
          Lạc lối giữa rạp phim
        </h2>
        <p className="text-white/60 text-sm sm:text-base mb-7 leading-relaxed">
          Cuốn phim bạn đang tìm kiếm có thể đã thay đổi đường dẫn hoặc đang bảo trì máy chủ phát.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-[#1bc25f] text-cinema-bg font-extrabold text-sm px-6 py-3 rounded-full shadow-[0_0_25px_rgba(32,214,107,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử Tải Lại Phim</span>
            </button>
          )}

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-[#1bc25f] text-cinema-bg font-extrabold text-sm px-7 py-3 rounded-full shadow-[0_0_25px_rgba(32,214,107,0.35)] transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 font-bold text-sm px-7 py-3 rounded-full transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Phim Mới</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang trước</span>
        </button>
      </div>
    </div>
  );
}

export function MovieDetailClientRescue({ slug }: { slug: string }) {
  const [data, setData] = useState<RescuedMovieData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMovie = useCallback(async () => {
    setLoading(true);
    const res = await fetchMovieClientSide(slug);
    setData(res);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadMovie();
  }, [loadMovie]);

  if (loading) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-3 bg-cinema-bg text-white px-4">
        <div className="w-11 h-11 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin" />
        <p className="text-xs font-mono text-white/60">Đang kết nối máy chủ phim...</p>
      </div>
    );
  }

  if (!data?.movie) {
    return <TrueNotFoundCard onRetry={loadMovie} />;
  }

  return <MovieDetailView movie={data.movie} episodes={data.episodes} />;
}

export function WatchClientRescue({ slug }: { slug: string }) {
  const [data, setData] = useState<RescuedMovieData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMovie = useCallback(async () => {
    setLoading(true);
    const res = await fetchMovieClientSide(slug);
    setData(res);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadMovie();
  }, [loadMovie]);

  if (loading) {
    return <LoadingWatch />;
  }

  if (!data?.movie) {
    return <TrueNotFoundCard onRetry={loadMovie} />;
  }

  return (
    <div className="min-h-screen bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      <main className="relative z-10 min-h-0 sm:min-h-screen flex flex-col w-full">
        <div className="w-full max-w-[1920px] mx-auto pb-3 sm:pb-16 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <Description
            movie={data.movie}
            serverData={data.episodes}
            slug={slug}
            thumb_url={data.movie.thumb_url}
          />
        </div>
      </main>
    </div>
  );
}
