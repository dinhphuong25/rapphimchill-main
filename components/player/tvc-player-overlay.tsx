"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ExternalLink, FastForward } from "lucide-react";

interface TVCPlayerOverlayProps {
  tvcUrl?: string;
  targetUrl?: string;
  skipAfterSeconds?: number;
  onComplete: () => void;
}

export default function TVCPlayerOverlay({
  tvcUrl = "https://bf.333xbet.com/18881999/video9922.mp4",
  targetUrl = "https://154.82.109.157/2138063.html",
  skipAfterSeconds = 5,
  onComplete,
}: TVCPlayerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(skipAfterSeconds);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  useEffect(() => {
    // Safety fallback: Nếu video không load được trong 5s, tự động vào phim chính
    const fallbackTimer = setTimeout(() => {
      if (!hasStarted) {
        onComplete();
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [hasStarted, onComplete]);

  // Cố gắng tự động phát video TVC
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // Nếu trình duyệt chặn âm thanh tự động, phát ở chế độ tắt tiếng (muted)
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {
        onComplete();
      });
    });
  }, [onComplete]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!hasStarted && video.currentTime > 0) {
      setHasStarted(true);
    }

    setCurrentTime(video.currentTime);
    const remaining = Math.max(0, Math.ceil(skipAfterSeconds - video.currentTime));
    setCountdown(remaining);

    if (video.currentTime >= skipAfterSeconds && !canSkip) {
      setCanSkip(true);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration || 0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  const handleOpenAd = () => {
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="absolute inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer group"
      onClick={handleOpenAd}
    >
      {/* Video TVC */}
      <video
        ref={videoRef}
        src={tvcUrl}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onComplete}
        onError={onComplete}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Top Header Bar: Badge QC & Nút xem chi tiết */}
      <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[11px] sm:text-xs backdrop-blur-md shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Quảng Cáo Tài Trợ</span>
          </div>
          {duration > 0 && (
            <span className="text-[11px] text-white/70 font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 hidden xs:inline">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          )}
        </div>

        {targetUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAd();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-[11px] sm:text-xs font-bold border border-white/20 hover:border-brand-green/60 hover:text-brand-green transition-all shadow-lg backdrop-blur-md cursor-pointer active:scale-95"
          >
            <span>Xem Chi Tiết</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-green" />
          </button>
        )}
      </div>

      {/* Bottom Controls Bar: Mute / Unmute & Skip Button */}
      <div className="absolute bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-6 flex items-center justify-between z-20 pointer-events-auto">
        {/* Toggle Mute */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 text-xs backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold text-white/90">Bật âm thanh</span>
            </>
          ) : (
            <Volume2 className="w-4 h-4 text-brand-green" />
          )}
        </button>

        {/* Nút Bỏ qua sau X giây hoặc Bỏ qua quảng cáo */}
        <div>
          {canSkip ? (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(32,214,107,0.5)] active:scale-95 transition-all cursor-pointer animate-in zoom-in-95 duration-150"
            >
              <span>Bỏ Qua Quảng Cáo</span>
              <FastForward className="w-4 h-4 fill-black" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 text-white/80 border border-white/20 text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-md">
              <span>Bỏ qua sau</span>
              <span className="font-mono text-amber-400 font-bold">{countdown}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar của TVC */}
      {duration > 0 && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-brand-green transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
