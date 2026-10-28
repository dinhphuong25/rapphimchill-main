"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import WatchPartyModal from "./watch-party-modal";

interface WatchPartyButtonProps {
  movieSlug: string;
  movieName: string;
  currentEpisodeIndex?: number;
  currentEpisodeName?: string;
  currentServerIndex?: number;
  currentTime?: number;
  isPlaying?: boolean;
  onSyncPlayback?: (state: { currentTime: number; isPlaying: boolean; episodeIndex: number }) => void;
  className?: string;
  variant?: "toolbar" | "compact" | "header";
}

export default function WatchPartyButton({
  movieSlug,
  movieName,
  currentEpisodeIndex = 0,
  currentEpisodeName = "Tập 1",
  currentServerIndex = 0,
  currentTime = 0,
  isPlaying = true,
  onSyncPlayback,
  className = "",
  variant = "toolbar",
}: WatchPartyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-8 px-2.5 sm:px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/30 text-brand-green flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm select-none touch-manipulation",
            className
          )}
          title="Xem chung cùng bạn bè (Watch Party)"
        >
          <Users className="w-3.5 h-3.5 text-brand-green shrink-0" />
          <span className="hidden xs:inline">Xem chung</span>
        </button>

        <WatchPartyModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          movieSlug={movieSlug}
          movieName={movieName}
          currentEpisodeIndex={currentEpisodeIndex}
          currentEpisodeName={currentEpisodeName}
          currentServerIndex={currentServerIndex}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSyncPlayback={onSyncPlayback}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-brand-green hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(32,214,107,0.15)] shrink-0 select-none",
          className
        )}
        title="Tạo phòng xem chung cùng bạn bè qua mạng"
      >
        <Users className="w-3.5 h-3.5 text-brand-green shrink-0" />
        <span className="hidden sm:inline">Xem chung</span>
        <span className="sm:hidden">Party</span>
      </button>

      <WatchPartyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        movieSlug={movieSlug}
        movieName={movieName}
        currentEpisodeIndex={currentEpisodeIndex}
        currentEpisodeName={currentEpisodeName}
        currentServerIndex={currentServerIndex}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSyncPlayback={onSyncPlayback}
      />
    </>
  );
}
