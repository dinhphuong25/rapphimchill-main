"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Star, 
  Play, 
  Crown, 
  Medal, 
  Film,
  Sparkles,
  Tv,
  Clapperboard,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMovieImageCandidates } from "@/lib/image-helper";
import type { AllRankingsData, RankingMovieItem, RankingPeriod } from "@/lib/data";

interface RankingClientProps {
  initialData: AllRankingsData;
}

type MovieTypeFilter = "all" | "series" | "single" | "cinema" | "anime";

const TABS: Array<{ id: RankingPeriod; label: string; icon: any; desc: string }> = [
  { id: "day", label: "Top Ngày", icon: Flame, desc: "Phim được xem nhiều nhất trong 24 giờ qua" },
  { id: "week", label: "Top Tuần", icon: TrendingUp, desc: "Bảng xếp hạng xu hướng thịnh hành trong tuần" },
  { id: "month", label: "Top Tháng", icon: Calendar, desc: "Những bộ phim thống trị phòng vé & bảng xếp hạng tháng" },
  { id: "views", label: "Top Lượt Xem", icon: Eye, desc: "Kỷ lục lượt xem cao nhất mọi thời đại trên Hi Phim" },
  { id: "rating", label: "Top Đánh Giá", icon: Star, desc: "Các siêu phẩm có điểm số IMDB / TMDB cao nhất" },
];

const TYPE_FILTERS: Array<{ id: MovieTypeFilter; label: string; icon: any }> = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "series", label: "Phim Bộ", icon: Tv },
  { id: "single", label: "Phim Lẻ", icon: Film },
  { id: "cinema", label: "Chiếu Rạp", icon: Clapperboard },
  { id: "anime", label: "Hoạt Hình", icon: Smile },
];

function RankingImage({
  movie,
  type = "poster",
  sizes,
  className = "object-cover",
}: {
  movie: RankingMovieItem;
  type?: "poster" | "backdrop";
  sizes?: string;
  className?: string;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const candidates = useMemo(() => getMovieImageCandidates(movie, type), [movie, type]);
  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!src) {
    return (
      <div className="w-full h-full bg-[#0c1310] flex flex-col items-center justify-center p-2 text-center">
        <Film className="w-6 h-6 text-brand-green/60 mb-1" />
        <span className="text-[10px] text-white/70 line-clamp-1">{movie.name}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={movie.name}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) setCandidateIdx((i) => i + 1);
        else setHasError(true);
      }}
    />
  );
}

function getRating(movie: RankingMovieItem): number | null {
  const tmdb = movie.tmdb?.vote_average;
  const imdb = movie.imdb?.vote_average;
  if (tmdb && tmdb > 0) return Number(tmdb.toFixed(1));
  if (imdb && imdb > 0) return Number(imdb.toFixed(1));
  return null;
}

function formatViews(num?: number): string {
  if (!num || num <= 0) return "10K+";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return num.toLocaleString();
}

export default function RankingClient({ initialData }: RankingClientProps) {
  const [activeTab, setActiveTab] = useState<RankingPeriod>("day");
  const [typeFilter, setTypeFilter] = useState<MovieTypeFilter>("all");

  const rawList = useMemo(() => {
    return initialData?.[activeTab] || [];
  }, [initialData, activeTab]);

  const filteredList = useMemo(() => {
    if (typeFilter === "all") return rawList;
    return rawList.filter((m) => {
      const type = (m.type || "").toLowerCase();
      const slug = (m.slug || "").toLowerCase();
      const categories = (m.category || []).map((c) => (c.name || "").toLowerCase());
      const catSlugs = (m.category || []).map((c) => (c.slug || "").toLowerCase());

      if (typeFilter === "series") {
        return type === "series" || categories.some((c) => c.includes("bộ")) || Boolean(m.episode_current && m.episode_current.toLowerCase().includes("tập"));
      }
      if (typeFilter === "single") {
        return type === "single" || categories.some((c) => c.includes("lẻ")) || (m.episode_current && m.episode_current.toLowerCase().includes("full"));
      }
      if (typeFilter === "cinema") {
        return categories.some((c) => c.includes("chiếu rạp")) || catSlugs.includes("phim-chieu-rap");
      }
      if (typeFilter === "anime") {
        return categories.some((c) => c.includes("hoạt hình") || c.includes("anime")) || type === "hoathinh" || slug.includes("hoat-hinh");
      }
      return true;
    });
  }, [rawList, typeFilter]);

  const top3 = filteredList.slice(0, 3);
  const restRankings = filteredList.slice(3);

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="w-full">
      {/* Header Banner */}
      <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cinema-surface via-cinema-sub to-cinema-bg border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-xs font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>Bảng Xếp Hạng Điện Ảnh Hi Phim</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              BẢNG XẾP HẠNG PHIM
            </h1>
            <p className="text-sm sm:text-base text-cinema-muted font-medium leading-relaxed">
              {activeTabMeta.desc}
            </p>
          </div>

          {/* Live indicator badge */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-cinema-muted self-start md:self-auto backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green" />
            </span>
            <span>Cập nhật liên tục 24/7</span>
          </div>
        </div>

        {/* 5 Tabs Navigation */}
        <div className="mt-8 sm:mt-10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-white/5 pt-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "bg-brand-green text-cinema-bg shadow-lg shadow-brand-green/20 scale-[1.02]"
                    : "bg-white/5 hover:bg-white/10 text-cinema-muted hover:text-white border border-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "stroke-[2.5]" : "stroke-2")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Filters: Movie Types */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <span className="text-xs font-bold text-cinema-dim uppercase tracking-wider mr-2 hidden sm:inline-block">
          Phân loại:
        </span>
        {TYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = typeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none",
                isActive
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-cinema-surface/60 hover:bg-cinema-surface text-cinema-dim hover:text-cinema-muted border border-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-cinema-surface/40 border border-white/5">
          <Trophy className="w-12 h-12 text-cinema-dim mb-4 stroke-1" />
          <h3 className="text-lg font-bold text-white mb-1">Chưa có phim trong mục này</h3>
          <p className="text-sm text-cinema-muted">Vui lòng chọn danh mục hoặc bộ lọc khác để xem bảng xếp hạng.</p>
        </div>
      ) : (
        <>
          {/* PODIUM SECTION (TOP 1, 2, 3) */}
          {top3.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Top 3 Vinh Danh
                </h2>
              </div>

              {/* Desktop Podium Layout: #2 (Silver) Left | #1 (Gold) Center | #3 (Bronze) Right */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-end">
                {/* RANK 2 - SILVER */}
                {top3[1] && (
                  <div className="order-2 md:order-1">
                    <PodiumCard movie={top3[1]} rank={2} theme="silver" />
                  </div>
                )}

                {/* RANK 1 - GOLD (Elevated center) */}
                {top3[0] && (
                  <div className="order-1 md:order-2 md:-translate-y-4">
                    <PodiumCard movie={top3[0]} rank={1} theme="gold" isChampion />
                  </div>
                )}

                {/* RANK 3 - BRONZE */}
                {top3[2] && (
                  <div className="order-3">
                    <PodiumCard movie={top3[2]} rank={3} theme="bronze" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEADERBOARD LIST (RANK 4 - 20) */}
          {restRankings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-brand-green" />
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                    Bảng Xếp Hạng Hạng 4 - 20
                  </h3>
                </div>
                <span className="text-xs text-cinema-dim font-bold">
                  {restRankings.length} tác phẩm
                </span>
              </div>

              <div className="space-y-3">
                {restRankings.map((movie, idx) => {
                  const rank = idx + 4;
                  return (
                    <LeaderboardRow key={movie._id || movie.slug} movie={movie} rank={rank} />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- */
/* PODIUM CARD COMPONENT                                         */
/* ------------------------------------------------------------- */

interface PodiumCardProps {
  movie: RankingMovieItem;
  rank: number;
  theme: "gold" | "silver" | "bronze";
  isChampion?: boolean;
}

function PodiumCard({ movie, rank, theme, isChampion }: PodiumCardProps) {
  const rating = getRating(movie);

  const themeConfig = {
    gold: {
      border: "border-amber-400/60 hover:border-amber-400",
      glow: "shadow-[0_0_40px_rgba(251,191,36,0.18)]",
      badgeBg: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black",
      badgeBorder: "border-amber-300",
      pedestalBg: "bg-amber-400/10",
      icon: Crown,
      medalText: "QUÁN QUÂN",
    },
    silver: {
      border: "border-slate-300/40 hover:border-slate-300/80",
      glow: "shadow-[0_0_30px_rgba(203,213,225,0.12)]",
      badgeBg: "bg-gradient-to-r from-slate-200 to-slate-400 text-black",
      badgeBorder: "border-slate-200",
      pedestalBg: "bg-slate-300/10",
      icon: Medal,
      medalText: "Á QUÂN",
    },
    bronze: {
      border: "border-amber-700/50 hover:border-amber-600/80",
      glow: "shadow-[0_0_30px_rgba(180,83,9,0.12)]",
      badgeBg: "bg-gradient-to-r from-amber-700 to-amber-600 text-white",
      badgeBorder: "border-amber-600",
      pedestalBg: "bg-amber-700/10",
      icon: Medal,
      medalText: "HẠNG 3",
    },
  }[theme];

  const Icon = themeConfig.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden bg-cinema-surface/90 border transition-all duration-300 hover:-translate-y-1.5",
        themeConfig.border,
        themeConfig.glow
      )}
    >
      {/* Top Banner with Rank Badge */}
      <div className={cn("px-4 py-2.5 flex items-center justify-between border-b border-white/10", themeConfig.pedestalBg)}>
        <div className="flex items-center gap-2">
          <div className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider flex items-center gap-1 shadow-md", themeConfig.badgeBg)}>
            <Icon className="w-3.5 h-3.5 fill-current" />
            <span>#{rank} {themeConfig.medalText}</span>
          </div>
        </div>

        {rating && (
          <div className="flex items-center gap-1 text-xs font-black text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Poster Image */}
      <Link href={`/watch?slug=${movie.slug}`} className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-cinema-sub block">
        <RankingImage
          movie={movie}
          type="backdrop"
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-surface via-transparent to-black/20" />

        {/* Quality and Year Badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {movie.quality && (
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-brand-green border border-brand-green/30">
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
              {movie.year}
            </span>
          )}
        </div>

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-cinema-bg shadow-xl scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-cinema-bg ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Movie Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/watch?slug=${movie.slug}`}>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-brand-green transition-colors line-clamp-1">
              {movie.name}
            </h3>
          </Link>
          {movie.origin_name && (
            <p className="text-xs text-cinema-dim font-medium line-clamp-1 mt-0.5">
              {movie.origin_name}
            </p>
          )}

          {/* Categories */}
          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {movie.category.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-cinema-muted border border-white/5"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-xs font-semibold text-cinema-dim flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cinema-muted" />
            <span>{formatViews(movie.view)} lượt xem</span>
          </span>

          <Link
            href={`/watch?slug=${movie.slug}`}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              isChampion
                ? "bg-brand-green text-cinema-bg hover:bg-brand-green-hover shadow-md shadow-brand-green/20"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Xem ngay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* LEADERBOARD ROW COMPONENT (RANK 4 - 20)                        */
/* ------------------------------------------------------------- */

interface LeaderboardRowProps {
  movie: RankingMovieItem;
  rank: number;
}

function LeaderboardRow({ movie, rank }: LeaderboardRowProps) {
  const rating = getRating(movie);

  return (
    <div className="group relative flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-xl bg-cinema-surface/70 hover:bg-cinema-surface border border-white/5 hover:border-brand-green/40 transition-all duration-200">
      {/* Rank Number */}
      <div className="w-10 sm:w-12 shrink-0 text-center">
        <span className="text-lg sm:text-2xl font-black font-mono tracking-tighter text-cinema-dim group-hover:text-brand-green transition-colors">
          #{rank < 10 ? `0${rank}` : rank}
        </span>
      </div>

      {/* Thumbnail */}
      <Link
        href={`/watch?slug=${movie.slug}`}
        className="relative w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-cinema-sub border border-white/10 group-hover:border-brand-green/40 transition-colors"
      >
        <RankingImage
          movie={movie}
          type="poster"
          sizes="80px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <Play className="w-4 h-4 fill-brand-green text-brand-green" />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-2">
        <Link href={`/watch?slug=${movie.slug}`}>
          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-green transition-colors truncate">
            {movie.name}
          </h4>
        </Link>
        <p className="text-xs text-cinema-dim truncate mt-0.5">
          {movie.origin_name || `${movie.year || ""}`}
        </p>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {movie.quality && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-green/10 text-brand-green border border-brand-green/20">
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="text-xs text-cinema-muted font-medium">
              {movie.year}
            </span>
          )}
          {movie.episode_current && (
            <span className="text-xs text-cinema-dim font-medium hidden sm:inline-block">
              • {movie.episode_current}
            </span>
          )}
          {movie.category && movie.category.length > 0 && (
            <span className="text-xs text-cinema-dim font-medium hidden md:inline-block">
              • {movie.category.map((c) => c.name).slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Stats & Quick Play */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        {rating && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold text-xs">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-cinema-dim font-medium">
          <Eye className="w-3.5 h-3.5 text-cinema-muted" />
          <span>{formatViews(movie.view)}</span>
        </div>

        <Link
          href={`/watch?slug=${movie.slug}`}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-brand-green text-cinema-muted hover:text-cinema-bg border border-white/10 hover:border-brand-green flex items-center justify-center transition-all duration-200"
          aria-label={`Xem phim ${movie.name}`}
        >
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
