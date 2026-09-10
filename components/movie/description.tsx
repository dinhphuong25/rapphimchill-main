"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Episode from "./episode";
import WatchHeader from "../watch/watch-header";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchHistory, useFavorites } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import MovieRecommendations from "./movie-recommendations";
import PlayerErrorBoundary from "../player/player-error-boundary";

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
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const defaultEpisode = serverData?.[0]?.server_data?.[0];
  const [currentEpisodeUrl, setCurrentEpisodeUrl] = useState<string>(
    () => defaultEpisode?.link_m3u8 || defaultEpisode?.link_embed || ""
  );
  const [resumeTime, setResumeTime] = useState<number>(() => {
    if (typeof window === "undefined" || !movie?.slug) return 0;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTime = parseInt(urlParams.get('t') || '');
      if (!isNaN(urlTime) && urlTime > 0) return urlTime;
      const key = `watchProgress_${movie.slug}_0_0`;
      const saved = Number(localStorage.getItem(key) || 0);
      return Number.isFinite(saved) ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<{
    server: number;
    episode: number;
  }>({ server: 0, episode: 0 });
  const [playerMode, setPlayerMode] = useState<'m3u8' | 'embed'>('m3u8');
  const [completedEpisodes, setCompletedEpisodes] = useState<Record<number, boolean>>({});
  const { updateProgress } = useContinueWatching();
  const { addToHistory } = useWatchHistory();
  const { toggleFavorite, isFavorite } = useFavorites();
  const prefetchedNextRef = useRef<string | null>(null);
  const lastSavedProgressRef = useRef<number>(0);

  const isFav = isFavorite(movie.slug);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite({
      slug: movie.slug,
      name: movie.name,
      origin_name: movie.origin_name,
      thumb_url: movie.thumb_url || movie.poster_url || "",
      poster_url: movie.poster_url,
      year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
      quality: movie.quality,
      episode_current: movie.episode_current,
      tmdb: movie.tmdb,
      imdb: movie.imdb,
    });

    if (!isFav) {
      toast.success(`Đã thêm "${movie.name}" vào phim yêu thích`);
    } else {
      toast.info(`Đã xóa "${movie.name}" khỏi phim yêu thích`);
    }
  }, [isFav, movie, toggleFavorite]);

  const favoriteButton = (
    <button
      onClick={handleToggleFavorite}
      className={cn(
        "w-full max-w-[260px] sm:max-w-[280px] mx-auto py-2 px-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-xs active:scale-[0.98] cursor-pointer group shadow-sm",
        isFav
          ? "bg-brand-green/15 border-brand-green/40 text-brand-green hover:bg-brand-green/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
          : "bg-[#222222] hover:bg-[#2a2a2a] text-white/80 hover:text-white border-transparent hover:border-white/10"
      )}
      title={isFav ? "Bấm để xóa khỏi danh sách yêu thích" : "Bấm để thêm vào danh sách yêu thích"}
    >
      <Heart
        className={cn(
          "w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0",
          isFav
            ? "fill-brand-green text-brand-green"
            : "text-white/60 group-hover:text-brand-green"
        )}
      />
      <span>{isFav ? "Đã Thêm Vào Yêu Thích" : "Thêm Vào Phim Yêu Thích"}</span>
    </button>
  );

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

  // Save movie to recently watched
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.slug) return;
    try {
      addToHistory({
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        poster_url: movie.poster_url || "",
        thumb_url: movie.thumb_url || "",
        quality: movie.quality,
        year: movie.year,
        episode_current: movie.episode_current,
        tmdb: movie.tmdb,
        imdb: movie.imdb,
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
    if (typeof window === "undefined" || !currentEpisodeIndex || playerMode !== 'm3u8') {
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
    } else {
      const nowInt = Math.floor(currentTime);
      if (nowInt > 5 && Math.abs(nowInt - lastSavedProgressRef.current) >= 5) {
        lastSavedProgressRef.current = nowInt;
        localStorage.setItem(key, String(nowInt));
        
        // Update master continue watching list throttled to every 5s
        updateProgress({
          slug: movie.slug,
          name: movie.name,
          poster_url: movie.poster_url,
          thumb_url: movie.thumb_url,
          serverIndex: server,
          episodeIndex: episode,
          episodeName: serverData?.[server]?.server_data?.[episode]?.name || "",
          currentTime: nowInt,
          duration: Math.floor(duration),
        });
      }
    }

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

  const handleSwitchToEmbed = useCallback(() => {
    setPlayerMode('embed');
    if (currentEpisodeIndex && serverData) {
      const currentEpisode = serverData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
      if (currentEpisode?.link_embed) setCurrentEpisodeUrl(currentEpisode.link_embed);
    }
  }, [currentEpisodeIndex, serverData]);

  const handleEnded = useCallback(() => {
    if (currentEpisodeIndex) {
      markEpisodeCompleted(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    }
  }, [currentEpisodeIndex, markEpisodeCompleted]);

  const currentEpName =
    currentEpisodeIndex &&
    serverData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.name
      ? serverData[currentEpisodeIndex.server].server_data[currentEpisodeIndex.episode].name
      : "";

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-6 z-10 relative lg:h-full lg:min-h-0">
      
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
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full max-w-[1600px] mx-auto pt-2 lg:flex-1 lg:min-h-0">
        
        {/* Left Primary Stage: Video Player & Movie Details */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          
          {/* Video Player Container with Dynamic OLED Backlight Glow */}
          <div className={cn("relative group/player w-full transition-all duration-500", isTheaterMode && "z-[85]")}>
            {/* Ambient backlight glow - desktop only to prevent mobile GPU lag */}
            <div className="absolute -inset-3 bg-gradient-to-r from-brand-green/25 via-brand-green/10 to-emerald-600/20 rounded-[32px] blur-3xl opacity-70 group-hover/player:opacity-100 transition-opacity pointer-events-none hidden sm:block will-change-transform" />

            <Card className="border border-white/10 overflow-hidden shadow-[0_0_90px_rgba(0,0,0,0.95)] w-full aspect-video rounded-2xl lg:rounded-3xl bg-black relative z-10">
              <CardContent className="p-0 h-full w-full">
                {playerMode === 'm3u8' ? (
                  <PlayerErrorBoundary
                    onReset={() => {
                      setPlayerMode('m3u8');
                      const ep = serverData?.[currentEpisodeIndex?.server || 0]?.server_data?.[currentEpisodeIndex?.episode || 0];
                      if (ep?.link_m3u8) setCurrentEpisodeUrl(ep.link_m3u8);
                    }}
                    onSwitchToEmbed={() => {
                      setPlayerMode('embed');
                      const ep = serverData?.[currentEpisodeIndex?.server || 0]?.server_data?.[currentEpisodeIndex?.episode || 0];
                      if (ep?.link_embed) setCurrentEpisodeUrl(ep.link_embed);
                    }}
                  >
                    <VideoPlayer
                      videoUrl={currentEpisodeUrl}
                      autoplay={true}
                      poster={movie.thumb_url || movie.poster_url}
                      initialTime={resumeTime}
                      movieName={movie.name}
                      movieSlug={movie.slug}
                      onProgress={handleProgress}
                      onSwitchToEmbed={handleSwitchToEmbed}
                      hasNextEpisode={hasNextEpisode()}
                      onNextEpisode={handleNextEpisode}
                      onEnded={handleEnded}
                    />
                  </PlayerErrorBoundary>
                ) : (
                  <EmbedPlayer
                    videoUrl={
                      (currentEpisodeIndex && serverData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.link_embed) ||
                      (currentEpisodeUrl.includes('.m3u8')
                        ? `https://player.phimapi.com/player/?url=${encodeURIComponent(currentEpisodeUrl)}`
                        : currentEpisodeUrl)
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>



          {/* Mobile Server Selector & Episode List (Directly after player & toolbar on mobile/tablet) */}
          <div className="w-full lg:hidden">
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
            >
              {favoriteButton}
            </Episode>
          </div>
        </div>

        {/* Desktop Right Sidebar Episode List */}
        <div className="hidden lg:flex w-full lg:w-[380px] 2xl:w-[420px] shrink-0 flex-col gap-4 lg:h-full lg:min-h-0">
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
          >
            {favoriteButton}
          </Episode>
        </div>

      </div>
    </div>
  );
}
