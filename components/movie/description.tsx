"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Episode from "./episode";
import WatchHeader from "../watch/watch-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  Heart, 
  Play,
  RotateCcw, 
  AlertTriangle, 
  SkipForward, 
  SkipBack, 
  Film, 
  Info,
  Layers
} from "lucide-react";
import { getFavoriteMovies, toggleFavoriteMovie } from "@/lib/user-experience";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchHistory } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import MovieRecommendations from "./movie-recommendations";

const VideoPlayer = dynamic(() => import("../player/video-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-black/90 flex flex-col items-center justify-center text-white/70 rounded-2xl border border-white/10 shadow-2xl">
      <div className="w-14 h-14 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
      <span className="text-sm font-bold tracking-wider text-brand-green animate-pulse uppercase">Đang nạp trình phát Video 4K...</span>
    </div>
  ),
});

const EmbedPlayer = dynamic(() => import("../player/embed-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-black/90 flex items-center justify-center text-white/70 text-sm rounded-2xl border border-white/10">
      Đang nạp máy chủ dự phòng...
    </div>
  ),
});

export default function Description({ movie, serverData }: any) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [currentEpisodeUrl, setCurrentEpisodeUrl] = useState("");
  const [resumeTime, setResumeTime] = useState(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<{
    server: number;
    episode: number;
  } | null>(null);
  const [playerMode, setPlayerMode] = useState<'m3u8' | 'embed'>('m3u8');
  const [completedEpisodes, setCompletedEpisodes] = useState<Record<number, boolean>>({});
  const { updateProgress } = useContinueWatching();
  const { addToHistory } = useWatchHistory();
  const prefetchedNextRef = useRef<string | null>(null);

  if (!movie || !movie.slug) return null;

  const getEpisodeProgressKey = useCallback((serverIndex: number, episodeIndex: number) => {
    return `watchProgress_${movie.slug}_${serverIndex}_${episodeIndex}`;
  }, [movie.slug]);

  const markEpisodeCompleted = useCallback((serverIndex: number, episodeIndex: number) => {
    if (typeof window === "undefined" || !movie?.slug) return;
    localStorage.setItem(`completedEp_${movie.slug}_${serverIndex}_${episodeIndex}`, "true");
    setCompletedEpisodes((prev) => ({ ...prev, [episodeIndex]: true }));
    const key = getEpisodeProgressKey(serverIndex, episodeIndex);
    localStorage.removeItem(key);
  }, [movie?.slug, getEpisodeProgressKey]);

  // Load completed episodes from storage on server change
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.slug || !serverData) return;
    const serverIndex = currentEpisodeIndex?.server || 0;
    const episodes = serverData[serverIndex]?.server_data || [];
    const completedMap: Record<number, boolean> = {};
    episodes.forEach((_: any, idx: number) => {
      if (localStorage.getItem(`completedEp_${movie.slug}_${serverIndex}_${idx}`) === "true") {
        completedMap[idx] = true;
      }
    });
    setCompletedEpisodes(completedMap);
  }, [movie?.slug, serverData, currentEpisodeIndex?.server]);

  const clearEpisodeProgress = useCallback((serverIndex: number, episodeIndex: number) => {
    localStorage.removeItem(getEpisodeProgressKey(serverIndex, episodeIndex));
  }, [getEpisodeProgressKey]);

  const handleServerChange = (serverIndex: number) => {
    setCurrentEpisodeIndex({ server: serverIndex, episode: 0 });
    if (serverData && serverData[serverIndex]?.server_data?.length > 0) {
      const firstEpisode = serverData[serverIndex].server_data[0];
      if (playerMode === 'm3u8' && firstEpisode?.link_m3u8) {
        setCurrentEpisodeUrl(firstEpisode.link_m3u8);
      } else if (playerMode === 'embed' && firstEpisode?.link_embed) {
        setCurrentEpisodeUrl(firstEpisode.link_embed);
      }
    }
  };

  const handleSelectEpisode = (
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => {
    setCurrentEpisodeUrl(link);
    setCurrentEpisodeIndex({ server: serverIndex, episode: episodeIndex });
  };

  useEffect(() => {
    const favorites = getFavoriteMovies();
    setIsFavorite(favorites.some((item) => item.slug === movie.slug));
  }, [movie.slug]);

  const handleToggleFavorite = useCallback(() => {
    const movieEntry = {
      slug: movie.slug,
      name: movie.name,
      poster_url: movie.poster_url,
      year: movie.year,
      quality: movie.quality,
      timestamp: Date.now(),
    };

    toggleFavoriteMovie(movieEntry);
    const favorites = getFavoriteMovies();
    const nextState = favorites.some((item) => item.slug === movie.slug);
    setIsFavorite(nextState);
    toast.success(nextState ? "Đã thêm vào danh sách yêu thích!" : "Đã xóa khỏi danh sách yêu thích!");
  }, [movie]);

  // Save movie to recently watched
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.slug) return;
    try {
      addToHistory({
        slug: movie.slug,
        name: movie.name,
        poster_url: movie.poster_url || "",
        thumb_url: movie.thumb_url || "",
        quality: movie.quality,
        year: movie.year,
        currentTime: 0,
        duration: 0,
      });
    } catch (e) {
      console.error(e);
    }
  }, [movie, addToHistory]);

  // Auto-select initial episode
  useEffect(() => {
    if (!serverData || serverData.length === 0) return;
    if (!currentEpisodeIndex) {
      const firstServer = serverData[0];
      if (firstServer?.server_data?.length > 0) {
        const firstEpisode = firstServer.server_data[0];
        setCurrentEpisodeIndex({ server: 0, episode: 0 });
        setCurrentEpisodeUrl(
          playerMode === 'm3u8' ? firstEpisode.link_m3u8 : firstEpisode.link_embed
        );
      }
    }
  }, [serverData, currentEpisodeIndex, playerMode]);

  // Update episode URL on playerMode change
  useEffect(() => {
    if (!currentEpisodeIndex || !serverData) return;
    const currentEpisode = serverData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
    if (currentEpisode) {
      if (playerMode === 'm3u8' && currentEpisode.link_m3u8) {
        setCurrentEpisodeUrl(currentEpisode.link_m3u8);
      } else if (playerMode === 'embed' && currentEpisode.link_embed) {
        setCurrentEpisodeUrl(currentEpisode.link_embed);
      }
    }
  }, [playerMode, currentEpisodeIndex, serverData]);

  // Resume progress
  useEffect(() => {
    if (!currentEpisodeIndex || playerMode !== 'm3u8') {
      setResumeTime(0);
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const urlTime = parseInt(urlParams.get('t') || '');
    if (!isNaN(urlTime) && urlTime > 0) {
      setResumeTime(urlTime);
      return;
    }
    const key = getEpisodeProgressKey(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    const savedProgress = Number(localStorage.getItem(key) || 0);
    setResumeTime(Number.isFinite(savedProgress) ? savedProgress : 0);
  }, [currentEpisodeIndex, playerMode, getEpisodeProgressKey]);

  const handleProgress = useCallback((currentTime: number, duration: number) => {
    if (!currentEpisodeIndex || playerMode !== 'm3u8') return;
    const { server, episode } = currentEpisodeIndex;
    const key = getEpisodeProgressKey(server, episode);

    // Episode is considered completed when watched >= 90% or within last 20 seconds of a video with duration >= 30s
    if (duration >= 30 && (currentTime >= duration * 0.9 || currentTime >= duration - 20)) {
      markEpisodeCompleted(server, episode);
    } else if (currentTime > 5) {
      localStorage.setItem(key, String(Math.floor(currentTime)));
    }
    
    // Update master continue watching list
    updateProgress({
      slug: movie.slug,
      name: movie.name,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      serverIndex: server,
      episodeIndex: episode,
      episodeName: serverData?.[server]?.server_data?.[episode]?.name || "",
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
    });

    // Background Prefetch next episode at 70% duration
    if (duration > 0 && currentTime > duration * 0.7 && serverData && currentEpisodeIndex) {
      const nextEp = serverData[server]?.server_data?.[episode + 1];
      if (nextEp?.link_m3u8 && prefetchedNextRef.current !== nextEp.link_m3u8) {
        prefetchedNextRef.current = nextEp.link_m3u8;
        fetch(nextEp.link_m3u8, { mode: 'no-cors' }).catch(() => {});
      }
    }
  }, [currentEpisodeIndex, playerMode, getEpisodeProgressKey, markEpisodeCompleted, updateProgress, movie, serverData]);

  const handleNextEpisode = useCallback(() => {
    if (!serverData || !currentEpisodeIndex) return;
    clearEpisodeProgress(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    const { server, episode } = currentEpisodeIndex;
    const currentServer = serverData[server];
    if (!currentServer) return;
    let nextEpisodeIndex = episode + 1;
    let nextServerIndex = server;
    if (nextEpisodeIndex >= currentServer.server_data.length) {
      nextServerIndex = server + 1;
      nextEpisodeIndex = 0;
      if (nextServerIndex >= serverData.length) return;
    }
    const nextServer = serverData[nextServerIndex];
    if (!nextServer || !nextServer.server_data) return;
    const nextEpisode = nextServer.server_data[nextEpisodeIndex];
    if (nextEpisode) {
      const link = playerMode === 'm3u8' ? nextEpisode.link_m3u8 : nextEpisode.link_embed;
      setCurrentEpisodeUrl(link);
      setCurrentEpisodeIndex({ server: nextServerIndex, episode: nextEpisodeIndex });
      toast.info(`Đã chuyển sang ${nextEpisode.name}`);
    }
  }, [serverData, currentEpisodeIndex, clearEpisodeProgress, playerMode]);

  const handlePrevEpisode = useCallback(() => {
    if (!serverData || !currentEpisodeIndex) return;
    const { server, episode } = currentEpisodeIndex;
    if (episode > 0) {
      const prevEpisode = serverData[server]?.server_data?.[episode - 1];
      if (prevEpisode) {
        const link = playerMode === 'm3u8' ? prevEpisode.link_m3u8 : prevEpisode.link_embed;
        handleSelectEpisode(link, server, episode - 1);
        toast.info(`Đã chuyển sang ${prevEpisode.name}`);
      }
    } else if (server > 0) {
      const prevServer = serverData[server - 1];
      if (prevServer?.server_data?.length > 0) {
        const lastIdx = prevServer.server_data.length - 1;
        const prevEpisode = prevServer.server_data[lastIdx];
        const link = playerMode === 'm3u8' ? prevEpisode.link_m3u8 : prevEpisode.link_embed;
        handleSelectEpisode(link, server - 1, lastIdx);
        toast.info(`Đã chuyển sang ${prevEpisode.name}`);
      }
    }
  }, [serverData, currentEpisodeIndex, playerMode]);

  // Global hotkeys for N (Next) and P (Prev)
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNextEpisode();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrevEpisode();
      }
    };
    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [handleNextEpisode, handlePrevEpisode]);

  const hasNextEpisode = () => {
    if (!serverData || !currentEpisodeIndex) return false;
    const { server, episode } = currentEpisodeIndex;
    const currentServer = serverData[server];
    if (!currentServer || !currentServer.server_data) return false;
    
    if (episode + 1 < currentServer.server_data.length) return true;
    if (server + 1 < serverData.length && serverData[server + 1]?.server_data?.length > 0) return true;
    return false;
  };

  const hasPrevEpisode = () => {
    if (!serverData || !currentEpisodeIndex) return false;
    const { server, episode } = currentEpisodeIndex;
    if (episode > 0) return true;
    if (server > 0 && serverData[server - 1]?.server_data?.length > 0) return true;
    return false;
  };

  const currentEpName =
    currentEpisodeIndex &&
    serverData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.name
      ? serverData[currentEpisodeIndex.server].server_data[currentEpisodeIndex.episode].name
      : "";

  const cleanContent = (movie.content || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-6 z-10 relative">
      
      {/* Standalone Cinema Header */}
      <WatchHeader
        movieName={movie.name}
        movieSlug={movie.slug}
        currentEpName={currentEpName}
        quality={movie.quality}
        isTheaterMode={isTheaterMode}
        onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
      />

      {/* Theater Mode Dark Backdrop Overlay */}
      {isTheaterMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-[80] transition-opacity duration-500 backdrop-blur-2xl cursor-pointer"
          onClick={() => setIsTheaterMode(false)}
        >
          <div className="absolute top-6 right-6 text-white/60 text-xs font-bold bg-white/10 px-4 py-2 rounded-full border border-white/20">
            Chế độ Tắt Đèn — Bấm vào đây để bật lại đèn
          </div>
        </div>
      )}

      {/* 2-Column Cinema Layout */}
      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start w-full max-w-[1600px] mx-auto pt-2">
        
        {/* Left Primary Stage: Video Player & Movie Details */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          
          {/* Video Player Container with Dynamic OLED Backlight Glow */}
          <div className={cn("relative group/player w-full transition-all duration-500", isTheaterMode && "z-[85]")}>
            {/* Ambient backlight glow */}
            <div className="absolute -inset-3 bg-gradient-to-r from-brand-green/25 via-brand-green/10 to-emerald-600/20 rounded-[32px] blur-3xl opacity-70 group-hover/player:opacity-100 transition-opacity pointer-events-none" />

            <Card className="border border-white/10 overflow-hidden shadow-[0_0_90px_rgba(0,0,0,0.95)] w-full aspect-video rounded-2xl lg:rounded-3xl bg-black relative z-10">
              <CardContent className="p-0 h-full w-full">
                {playerMode === 'm3u8' ? (
                  <VideoPlayer
                    videoUrl={currentEpisodeUrl}
                    autoplay={true}
                    poster={movie.thumb_url || movie.poster_url}
                    initialTime={resumeTime}
                    movieName={movie.name}
                    movieSlug={movie.slug}
                    onProgress={handleProgress}
                    onSwitchToEmbed={() => {
                      setPlayerMode('embed');
                      if (currentEpisodeIndex && serverData) {
                        const currentEpisode = serverData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
                        if (currentEpisode?.link_embed) setCurrentEpisodeUrl(currentEpisode.link_embed);
                      }
                    }}
                    hasNextEpisode={hasNextEpisode()}
                    onNextEpisode={handleNextEpisode}
                    onEnded={() => {
                      if (currentEpisodeIndex) {
                        markEpisodeCompleted(currentEpisodeIndex.server, currentEpisodeIndex.episode);
                      }
                    }}
                  />
                ) : (
                  <EmbedPlayer videoUrl={currentEpisodeUrl} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Cinema Action Toolbar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-2xl relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex items-center gap-2 flex-wrap relative z-10">
              {/* Prev Episode */}
              <Button
                onClick={handlePrevEpisode}
                disabled={!hasPrevEpisode()}
                variant="outline"
                size="sm"
                className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border-white/10 disabled:opacity-30"
              >
                <SkipBack className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Tập trước (P)</span>
                <span className="sm:hidden">Trước</span>
              </Button>

              {/* Next Episode */}
              <Button
                onClick={handleNextEpisode}
                disabled={!hasNextEpisode()}
                size="sm"
                className="bg-brand-green hover:bg-brand-green-hover text-cinema-bg font-extrabold rounded-xl shadow-[0_0_18px_rgba(34,197,94,0.35)] disabled:opacity-30"
              >
                <span>Tập tiếp (N)</span>
                <SkipForward className="w-4 h-4 ml-1.5" />
              </Button>

              {/* Replay */}
              {resumeTime > 10 && (
                <Button
                  onClick={() => {
                    const video = document.querySelector('video');
                    if (video) { video.currentTime = 0; video.play().catch(() => {}); }
                    setResumeTime(0);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 hover:bg-white/10 text-white/80 rounded-xl border-white/10 text-xs font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Xem lại</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Favorite Button */}
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl border transition-all font-bold text-xs",
                  isFavorite
                    ? "bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                )}
              >
                <Heart className={cn("w-4 h-4 mr-1.5", isFavorite && "fill-rose-500")} />
                <span className="hidden sm:inline">{isFavorite ? "Đã thích" : "Yêu thích"}</span>
              </Button>

              {/* Report Issue */}
              <Button
                onClick={() => toast.info("Đã ghi nhận thông báo lỗi. Cảm ơn bạn!")}
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/80 rounded-xl hover:bg-white/5 px-2.5"
                title="Báo lỗi video"
              >
                <AlertTriangle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Server Selector & Episode List (Directly after player & toolbar on mobile/tablet) */}
          <div className="w-full xl:hidden">
            <Episode
              serverData={serverData}
              currentServerIndex={currentEpisodeIndex?.server || 0}
              currentEpisodeIndex={currentEpisodeIndex?.episode || 0}
              onSelectEpisode={handleSelectEpisode}
              onServerChange={handleServerChange}
              thumb_url={movie.thumb_url}
              playerMode={playerMode}
              onPlayerModeChange={(mode) => setPlayerMode(mode)}
              movieSlug={movie.slug}
              completedEpisodes={completedEpisodes}
            />
          </div>

          {/* Movie Details & Description Card - Single Column Card inside Left Stage */}
          <div className="w-full sm:rounded-2xl lg:rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-brand-green/20 to-transparent" />
            
            <div className="p-5 sm:p-7 lg:p-9 space-y-6 relative z-10">
              
              {/* Header Title & Badges */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{movie.name}</h1>
                  <Badge className="bg-brand-green/20 text-brand-green border border-brand-green/40 text-xs px-3 py-1 font-bold">{movie.quality || "HD"}</Badge>
                  {movie.origin_name && <span className="text-sm text-white/50 font-medium">({movie.origin_name})</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-white/80">{movie.lang || "Vietsub"}</span>
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-white/80">{movie.time || "Đang cập nhật"}</span>
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-white/80">{movie.year || "N/A"}</span>
                </div>
              </div>

              {/* Metadata Horizontal Ribbon - 3 Columns inside card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner">
                {/* Director */}
                <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
                  <p className="text-[11px] text-brand-green uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Đạo diễn
                  </p>
                  <p className="text-xs sm:text-sm text-white/90 font-semibold leading-normal">
                    {movie.director?.length ? movie.director.join(", ") : "Đang cập nhật"}
                  </p>
                </div>

                {/* Cast */}
                <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
                  <p className="text-[11px] text-brand-green uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Diễn viên
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed line-clamp-3">
                    {movie.actor?.length ? movie.actor.join(", ") : "Đang cập nhật"}
                  </p>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <p className="text-[11px] text-brand-green uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Thể loại
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.category?.map((cat: any, i: number) => (
                      <span key={i} className="text-xs bg-brand-green/15 text-brand-green px-2.5 py-1 rounded-lg border border-brand-green/30 font-bold">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synopsis / Nội dung phim */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2.5">
                  <span className="w-2 h-5 rounded-full bg-brand-green inline-block shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  Nội dung phim
                </h3>
                <p className="text-sm sm:text-base text-white/85 text-justify leading-[1.85] break-words font-medium tracking-[0.015em] opacity-90">
                  {cleanContent || "Chưa có thông tin nội dung phim."}
                </p>

                {movie.trailer_url && (
                  <div className="pt-2">
                    <Button
                      onClick={() => setShowTrailer(true)}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border-white/10 text-xs px-4 py-2 flex items-center gap-2 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
                      Xem Trailer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Right Sidebar Episode List */}
        <div className="hidden xl:flex w-full xl:w-[380px] 2xl:w-[420px] shrink-0 flex-col gap-6 sticky top-20">
          <Episode
            serverData={serverData}
            currentServerIndex={currentEpisodeIndex?.server || 0}
            currentEpisodeIndex={currentEpisodeIndex?.episode || 0}
            onSelectEpisode={handleSelectEpisode}
            onServerChange={handleServerChange}
            thumb_url={movie.thumb_url}
            playerMode={playerMode}
            onPlayerModeChange={(mode) => setPlayerMode(mode)}
            movieSlug={movie.slug}
            completedEpisodes={completedEpisodes}
          />
        </div>

      </div>

      {/* Trailer Dialog */}
      <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
        <DialogContent className="sm:max-w-4xl bg-black/95 border-white/10">
          <DialogTitle className="text-white text-xl font-bold mb-2">Trailer - {movie.name}</DialogTitle>
          <div className="aspect-video rounded-xl overflow-hidden">
            {movie.trailer_url ? (
              <iframe
                src={movie.trailer_url.replace("watch?v=", "embed/")}
                className="w-full h-full border-0"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">Không có video trailer</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
