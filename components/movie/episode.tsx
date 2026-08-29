"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Server } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EpisodeData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface ServerData {
  server_name: string;
  server_data: EpisodeData[];
}

interface EpisodeProps {
  serverData: ServerData[];
  currentServerIndex: number;
  currentEpisodeIndex: number;
  onSelectEpisode: (
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => void;
  onServerChange: (serverIndex: number) => void;
  thumb_url?: string;
  playerMode: "m3u8" | "embed";
  onPlayerModeChange: (mode: "m3u8" | "embed") => void;
}

export default function Episode({
  serverData,
  currentServerIndex,
  currentEpisodeIndex,
  onSelectEpisode,
  onServerChange,
  playerMode,
  onPlayerModeChange,
}: EpisodeProps) {
  const handleServerChange = (index: number) => {
    const firstEpisode = serverData[index]?.server_data?.[0];
    if (firstEpisode) {
      if (playerMode === "m3u8" && firstEpisode.link_m3u8) {
        onSelectEpisode(firstEpisode.link_m3u8, index, 0);
      } else if (playerMode === "embed" && firstEpisode.link_embed) {
        onSelectEpisode(firstEpisode.link_embed, index, 0);
      }
    }
    onServerChange(index);
  };

  if (!serverData || serverData.length === 0) {
    return (
      <div className="w-full p-4 text-center text-white/50">
        Không có tập phim nào
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Server & Player Mode Card - Redesigned to match the screenshot exactly */}
      <div className="bg-[#141414] rounded-2xl border border-white/5 p-5 flex flex-col gap-6 relative">
        
        {/* Máy Chủ Phát Section */}
        <div className="space-y-4 min-w-0 z-10 relative">
          <h4 className="text-white/60 text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <Server className="w-4 h-4 text-brand-green shrink-0" />
            Máy chủ phát
          </h4>

          {/* Grid of Server Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {serverData.flatMap((server, index) => [
              <button
                key={`${index}-m3u8`}
                onClick={() => {
                  onPlayerModeChange("m3u8");
                  if (currentServerIndex !== index) handleServerChange(index);
                }}
                className={cn(
                  "w-full py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all border",
                  currentServerIndex === index && playerMode === "m3u8"
                    ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                    : "bg-[#222222] text-white/50 border-transparent hover:bg-[#2a2a2a] hover:text-white/80"
                )}
              >
                <span className={cn(
                  "text-[13px] font-medium leading-tight",
                  currentServerIndex === index && playerMode === "m3u8" ? "text-brand-green" : "text-white/80"
                )}>
                  {server.server_name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Mặc định
                </span>
              </button>,
              <button
                key={`${index}-embed`}
                onClick={() => {
                  onPlayerModeChange("embed");
                  if (currentServerIndex !== index) handleServerChange(index);
                }}
                className={cn(
                  "w-full py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all border",
                  currentServerIndex === index && playerMode === "embed"
                    ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                    : "bg-[#222222] text-white/50 border-transparent hover:bg-[#2a2a2a] hover:text-white/80"
                )}
              >
                <span className={cn(
                  "text-[13px] font-medium leading-tight",
                  currentServerIndex === index && playerMode === "embed" ? "text-brand-green" : "text-white/80"
                )}>
                  {server.server_name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Dự phòng
                </span>
              </button>,
            ])}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EpisodeListProps extends Omit<EpisodeProps, "onServerChange" | "onPlayerModeChange"> {
  movieSlug?: string;
}

const ITEMS_PER_RANGE = 50;

export function EpisodeList({
  serverData,
  currentServerIndex,
  currentEpisodeIndex,
  onSelectEpisode,
  playerMode,
  movieSlug,
}: EpisodeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);

  if (!serverData || serverData.length === 0) return null;
  const currentServer = serverData[currentServerIndex];
  const allEpisodes = currentServer?.server_data || [];

  // Sort episodes logically
  const sortedEpisodes = useMemo(() => {
    return [...allEpisodes].map((ep) => {
      const originalIndex = allEpisodes.findIndex((e) => e.name === ep.name);
      return { ...ep, originalIndex };
    }).sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || "0") || 0;
      const numB = parseInt(b.name.match(/\d+/)?.[0] || "0") || 0;
      return numA - numB;
    });
  }, [allEpisodes]);

  // Episode Range Tabs (e.g. 1-50, 51-100)
  const totalRanges = Math.ceil(sortedEpisodes.length / ITEMS_PER_RANGE);

  // Filtered episodes based on search or active range
  const displayedEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return sortedEpisodes.filter(
        (ep) =>
          ep.name.toLowerCase().includes(query) ||
          ep.slug.toLowerCase().includes(query)
      );
    }
    const start = activeRangeIndex * ITEMS_PER_RANGE;
    return sortedEpisodes.slice(start, start + ITEMS_PER_RANGE);
  }, [sortedEpisodes, searchQuery, activeRangeIndex]);

  const handleEpisodeChange = (
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => {
    onSelectEpisode(link, serverIndex, episodeIndex);
  };

  return (
    <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-white/[0.08] p-4 sm:p-6 flex flex-col w-full z-10 relative mt-4 xl:mt-0 overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-brand-green/20 to-transparent" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-4 rounded-full bg-brand-green shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          <h4 className="text-white font-extrabold text-base sm:text-lg tracking-wide">
            Danh sách tập
          </h4>
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
            {allEpisodes.length} tập
          </span>
        </div>

        {/* Search input for quick episode lookup */}
        {allEpisodes.length > 8 && (
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="Tìm tập phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 h-9 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/40 rounded-xl focus:border-brand-green/50 focus:ring-brand-green/20"
            />
          </div>
        )}
      </div>

      {/* Range Tabs for large series (50+ episodes) */}
      {totalRanges > 1 && !searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {Array.from({ length: totalRanges }).map((_, rIdx) => {
            const startEp = rIdx * ITEMS_PER_RANGE + 1;
            const endEp = Math.min((rIdx + 1) * ITEMS_PER_RANGE, sortedEpisodes.length);
            const isSelected = rIdx === activeRangeIndex;

            return (
              <button
                key={rIdx}
                onClick={() => setActiveRangeIndex(rIdx)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0",
                  isSelected
                    ? "bg-brand-green/20 text-brand-green border-brand-green/40 shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                Tập {startEp} - {endEp}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Episodes */}
      <div className="w-full">
        {displayedEpisodes.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2.5 sm:gap-3 w-full">
            {displayedEpisodes.map((episode) => {
              const originalIndex = episode.originalIndex;
              const isActive = originalIndex === currentEpisodeIndex;

              const isWatched =
                typeof window !== "undefined" && movieSlug
                  ? Boolean(
                      localStorage.getItem(
                        `watchProgress_${movieSlug}_${currentServerIndex}_${originalIndex}`
                      )
                    )
                  : false;

              return (
                <button
                  key={`${currentServerIndex}-${originalIndex}`}
                  onClick={() =>
                    handleEpisodeChange(
                      playerMode === "m3u8" ? episode.link_m3u8 : episode.link_embed,
                      currentServerIndex,
                      originalIndex
                    )
                  }
                  className={cn(
                    "relative flex h-11 w-full items-center justify-center px-3 py-2 rounded-xl transition-all border group text-center shadow-sm",
                    isActive
                      ? "bg-brand-green/20 text-brand-green border-brand-green/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-brand-green/40"
                      : isWatched
                      ? "bg-white/5 text-brand-green/90 border-brand-green/20 hover:bg-white/10"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/12 hover:border-white/30 hover:text-white"
                  )}
                  title={episode.name}
                >
                  {/* Equalizer Playing Indicator for active episode */}
                  {isActive ? (
                    <div className="absolute top-1 right-1 flex items-end gap-[2px] h-3">
                      <span className="w-[2px] h-full bg-brand-green rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-[2px] h-full bg-brand-green rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-[2px] h-full bg-brand-green rounded-full animate-bounce" />
                    </div>
                  ) : isWatched ? (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-green/20 border border-brand-green/40 text-brand-green rounded-full flex items-center justify-center text-[9px] font-bold z-10">
                      ✓
                    </div>
                  ) : null}

                  <span
                    className={cn(
                      "font-extrabold text-sm sm:text-[15px] leading-tight truncate w-full text-center transition-colors duration-300",
                      isActive
                        ? "text-brand-green drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : isWatched
                        ? "text-brand-green/90"
                        : "text-white/80 group-hover:text-white"
                    )}
                  >
                    {episode.name.replace(/(\d+)/g, (match) =>
                      String(parseInt(match, 10))
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full text-center py-10 text-white/50 border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm">Không tìm thấy tập phim phù hợp với từ khóa</p>
          </div>
        )}
      </div>
    </div>
  );
}
