"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, SkipForward } from "lucide-react";

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

  return (
    <div
      className="absolute inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
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

      {/* Bottom Controls Bar: Mute & Nút Bỏ Qua Quảng Cáo Nhỏ Gọn, Tối Giản */}
      <div className="absolute bottom-2.5 sm:bottom-4 inset-x-3 sm:inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
        {/* Toggle Mute Nhỏ Gọn */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 text-[11px] backdrop-blur-sm transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-white/90" />
              <span className="text-[10px] text-white/80">Bật tiếng</span>
            </>
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-white/90" />
          )}
        </button>

        {/* Nút Bỏ qua quảng cáo: Nhỏ gọn, tối giản, màu trung tính chuẩn Youtube/Netflix */}
        <div>
          {canSkip ? (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded bg-black/75 hover:bg-black/90 active:bg-black text-white text-[11px] sm:text-xs font-medium border border-white/25 hover:border-white/50 backdrop-blur-md shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>Bỏ qua quảng cáo</span>
              <SkipForward className="w-3.5 h-3.5 text-white" />
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/60 text-white/70 border border-white/15 text-[10px] sm:text-[11px] font-medium backdrop-blur-sm shadow-sm">
              <span>Bỏ qua sau</span>
              <span className="font-mono text-white font-semibold">{countdown}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar của TVC tối giản */}
      {duration > 0 && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/15 z-30">
          <div
            className="h-full bg-white/70 transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
