"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, AlertTriangle, Tv, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  videoUrl: string;
  onEnded?: () => void;
  onSwitchToM3u8?: () => void;
  onReportError?: () => void;
  movieName?: string;
  episodeName?: string;
  isStreamSyncing?: boolean;
  hasAlternativeServer?: boolean;
  onSwitchServer?: () => void;
}

const EmbedPlayer = ({
  videoUrl,
  onEnded,
  onSwitchToM3u8,
  onReportError,
  movieName,
  episodeName,
  isStreamSyncing: propIsStreamSyncing,
  hasAlternativeServer,
  onSwitchServer,
}: EmbedPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [detectedSyncing, setDetectedSyncing] = useState(false);
  const [showSlowHelper, setShowSlowHelper] = useState(false);
  const router = useRouter();

  // Extract nested stream URL if videoUrl is a player wrapper (e.g. player.phimapi.com/player/?url=...)
  const underlyingStreamUrl = useMemo(() => {
    try {
      if (videoUrl.includes("?url=")) {
        const raw = videoUrl.split("?url=")[1];
        return decodeURIComponent(raw);
      }
    } catch {}
    return "";
  }, [videoUrl]);

  // Check stream reachability proactively to detect HTTP 404 / syncing on upstream
  useEffect(() => {
    if (!underlyingStreamUrl) return;
    let isCancelled = false;

    fetch(`/api/check-stream?url=${encodeURIComponent(underlyingStreamUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.syncing || data.status === 404) {
          setDetectedSyncing(true);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [underlyingStreamUrl, iframeKey]);

  const isSyncing = propIsStreamSyncing || detectedSyncing;

  useEffect(() => {
    setIsLoading(true);
    setShowSlowHelper(false);

    // Initial loading pulse
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    // If iframe is still loading after 7 seconds, display quick recovery helper
    const slowTimer = setTimeout(() => {
      setShowSlowHelper(true);
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(slowTimer);
    };
  }, [videoUrl, iframeKey]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleReload = useCallback(() => {
    setIsLoading(true);
    setShowSlowHelper(false);
    setIframeKey((prev) => prev + 1);
  }, []);

  return (
    <div className="relative bg-black w-full h-full group select-none overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      {/* Top gradient overlay for controls */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 pointer-events-none transition-opacity duration-300" />

      {/* Top Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 bg-black/60 hover:bg-black/90 backdrop-blur-md text-white rounded-full transition-all border border-white/10 active:scale-95 cursor-pointer shadow-lg"
          title="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Quick Actions (Switch to Default HLS, Reload, Report) */}
        <div className="flex items-center gap-2">
          {onSwitchToM3u8 && (
            <button
              onClick={onSwitchToM3u8}
              className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md text-[11px] font-bold text-white/90 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              title="Chuyển sang Máy chủ Mặc định (HLS)"
            >
              <Tv className="w-3.5 h-3.5 text-brand-green" />
              <span className="hidden sm:inline">Máy chủ Mặc định</span>
            </button>
          )}

          <button
            onClick={handleReload}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
            title="Tải lại trình phát"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onReportError && (
            <button
              onClick={onReportError}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-amber-400 hover:text-amber-300 border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Báo lỗi video"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Iframe */}
      <iframe
        key={iframeKey}
        src={videoUrl}
        className="w-full h-full absolute inset-0 rounded-2xl border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        title="Video Player"
        onLoad={() => setIsLoading(false)}
      />

      {/* Initial Loading Indicator */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/90 z-20 transition-opacity duration-500 pointer-events-none ${
          isLoading && !isSyncing ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wide animate-pulse">
            Đang kết nối Máy chủ Dự phòng...
          </p>
        </div>
      </div>

      {/* SYNCING / 404 OVERLAY: When episode was just uploaded and CDN is not yet synced */}
      {isSyncing && (
        <div className="absolute inset-0 z-40 bg-[#070908]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3.5 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2.5">
            <span>MÁY CHỦ NGUỒN ĐANG ĐỒNG BỘ • MÃ 404</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            Tập phim đang được xử lý
          </h3>

          <p className="text-xs sm:text-sm text-white/70 max-w-md mb-5 leading-relaxed">
            {episodeName ? `${episodeName} vừa` : "Tập này vừa"} được cập nhật lên hệ thống. Máy chủ nguồn video đang trong quá trình đồng bộ và chuyển mã dữ liệu (Mã 404). Vui lòng thử lại sau ít phút hoặc đổi sang máy chủ khác bên dưới.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button
              onClick={handleReload}
              size="sm"
              variant="outline"
              className="rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer h-9 px-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Thử lại kết nối
            </Button>

            {hasAlternativeServer && onSwitchServer && (
              <Button
                onClick={onSwitchServer}
                size="sm"
                className="bg-brand-green hover:bg-brand-green/90 text-black font-extrabold rounded-xl shadow-lg cursor-pointer h-9 px-4"
              >
                Đổi máy chủ khác
              </Button>
            )}

            {onSwitchToM3u8 && (
              <Button
                onClick={onSwitchToM3u8}
                size="sm"
                variant="outline"
                className="rounded-xl border-brand-green/30 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green font-bold cursor-pointer h-9 px-4"
              >
                Thử Máy chủ Mặc định
              </Button>
            )}

            {onReportError && (
              <Button
                onClick={onReportError}
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-bold rounded-xl cursor-pointer h-9 px-3"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Báo lỗi
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Subtle Recovery Bar for slow / stuck connections without 404 */}
      {showSlowHelper && !isSyncing && (
        <div className="absolute bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-300">
          <div className="bg-black/85 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-white shadow-2xl">
            <div className="flex items-center gap-2 text-white/80 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="truncate">Video tải chậm hoặc đứng hình xoay tròn?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onSwitchToM3u8 && (
                <button
                  onClick={onSwitchToM3u8}
                  className="px-2.5 py-1 bg-brand-green/20 hover:bg-brand-green/30 text-brand-green font-bold rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  Đổi Mặc định
                </button>
              )}
              {hasAlternativeServer && onSwitchServer && (
                <button
                  onClick={onSwitchServer}
                  className="px-2.5 py-1 bg-brand-green text-black font-extrabold rounded-lg hover:bg-brand-green/90 transition-all text-[11px] cursor-pointer"
                >
                  Đổi máy chủ
                </button>
              )}
              <button
                onClick={handleReload}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all text-[11px] cursor-pointer"
              >
                Tải lại
              </button>
              {onReportError && (
                <button
                  onClick={onReportError}
                  className="px-2 py-1 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-bold rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  Báo lỗi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedPlayer;
