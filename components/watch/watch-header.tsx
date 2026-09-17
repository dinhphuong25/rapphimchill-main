"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Share2,
  Check,
  Copy,
  Clock,
  X,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WatchHeaderProps {
  movieName: string;
  movieSlug: string;
  currentEpName?: string;
  currentTime?: number;
  episodeIndex?: number;
}

const emptySubscribe = () => () => {};

const formatSeconds = (sec: number) => {
  if (isNaN(sec) || sec <= 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function WatchHeader({
  movieName,
  movieSlug,
  currentEpName,
  currentTime = 0,
  episodeIndex = 0,
}: WatchHeaderProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [capturedTime, setCapturedTime] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Read the exact real-time playback second when opening the Share modal
  const handleOpenShare = () => {
    let exactSec = 0;
    try {
      const videoEl = document.querySelector("video");
      if (videoEl && !isNaN(videoEl.currentTime) && videoEl.currentTime > 0) {
        exactSec = Math.floor(videoEl.currentTime);
      } else if (currentTime > 0) {
        exactSec = Math.floor(currentTime);
      }
    } catch {
      exactSec = Math.floor(currentTime || 0);
    }

    setCapturedTime(exactSec);
    setIncludeTimestamp(exactSec > 5);
    setCopied(false);
    setShowShareModal(true);
  };

  // Construct sharing link
  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return `https://hiphim.biz/watch?slug=${movieSlug}`;
    }
    const origin = window.location.origin;
    const epParam = `&ep=${episodeIndex + 1}`;
    const timeParam = includeTimestamp && capturedTime > 5 ? `&t=${capturedTime}` : "";
    return `${origin}/watch?slug=${movieSlug}${epParam}${timeParam}`;
  }, [movieSlug, episodeIndex, includeTimestamp, capturedTime]);

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép liên kết xem phim!", {
        description: includeTimestamp && capturedTime > 5
          ? `Kèm mốc phát tại ${formatSeconds(capturedTime)}`
          : "Sẵn sàng chia sẻ cho bạn bè",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Không thể sao chép, vui lòng copy thủ công.");
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const epSuffix = currentEpName ? ` - ${currentEpName}` : "";
    const timeSuffix = includeTimestamp && capturedTime > 5 ? ` (mốc ${formatSeconds(capturedTime)})` : "";
    const title = `Xem phim ${movieName}${epSuffix} trên Hi Phim`;
    const text = `Cùng xem phim ${movieName}${timeSuffix} chất lượng cao miễn phí tại Hi Phim nhé!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShowShareModal(false);
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: "facebook" | "zalo" | "telegram" | "twitter") => {
    const url = encodeURIComponent(getShareUrl());
    const epSuffix = currentEpName ? ` - ${currentEpName}` : "";
    const text = encodeURIComponent(`Xem phim ${movieName}${epSuffix} trên Hi Phim`);

    let target = "";
    if (platform === "facebook") {
      target = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === "zalo") {
      target = `https://zalo.me/share?url=${url}`;
    } else if (platform === "telegram") {
      target = `https://t.me/share/url?url=${url}&text=${text}`;
    } else if (platform === "twitter") {
      target = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    }

    if (target) {
      window.open(target, "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  // Close modal on click outside or escape key + lock body scroll on mobile
  useEffect(() => {
    if (!showShareModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowShareModal(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowShareModal(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showShareModal]);

  return (
    <>
      <div className="sticky top-0 z-40 w-full max-w-[1800px] mx-auto transition-all shrink-0">
        <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-3xl px-3 sm:px-6 py-2.5 shadow-2xl relative">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back button & Breadcrumb Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/");
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-2.5 sm:px-3 py-2 flex items-center gap-1.5 sm:gap-2 border border-white/10 shrink-0 cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green" />
                <span className="text-xs font-bold hidden sm:inline">Trở về</span>
              </Button>

              <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />

              {/* Breadcrumb info */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs sm:text-sm">
                <Link
                  href="/"
                  className="text-white/50 hover:text-brand-green transition-colors flex items-center gap-1 shrink-0"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Trang chủ</span>
                </Link>
                <span className="text-white/30 shrink-0">/</span>
                <span className="text-white/90 font-semibold truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[360px]">
                  {movieName}
                </span>
                {currentEpName && (
                  <>
                    <span className="text-white/30 shrink-0">/</span>
                    <span className="text-brand-green font-bold truncate max-w-[80px] sm:max-w-[140px]">
                      {currentEpName}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Smart Share Button */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleOpenShare}
                variant="outline"
                size="sm"
                className="bg-white/5 hover:bg-brand-green/20 hover:text-brand-green hover:border-brand-green/40 border-white/10 text-white/90 text-xs font-bold rounded-xl px-3 py-2 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                title="Chia sẻ phim kèm mốc thời gian"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-green" />
                <span className="hidden xs:inline">Chia sẻ</span>
              </Button>
            </div>
          </div>
        </header>
      </div>

      {/* Modern Cinema Share Dialog / Bottom Sheet (Mounted to Body to prevent iOS Safari filter clipping) */}
      {mounted && showShareModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="relative w-full max-w-lg rounded-t-[28px] sm:rounded-3xl bg-[#0c120e] border-t sm:border border-brand-green/30 p-5 sm:p-6 pb-7 sm:pb-6 shadow-[0_-15px_50px_rgba(0,0,0,0.9)] sm:shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-250 select-none max-h-[90dvh] overflow-y-auto"
          >
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3.5 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green/30 to-emerald-700/20 border border-brand-green/40 flex items-center justify-center text-brand-green shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.2)]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white tracking-tight">Chia sẻ phim</h4>
                  <p className="text-[11px] text-white/50 truncate max-w-[240px] sm:max-w-[320px]">
                    {movieName} {currentEpName ? `• ${currentEpName}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timestamp Option Card with iOS Toggle */}
            <button
              type="button"
              onClick={() => setIncludeTimestamp(!includeTimestamp)}
              className={cn(
                "w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer text-left mb-4",
                includeTimestamp
                  ? "bg-brand-green/[0.08] border-brand-green/40 shadow-[0_0_20px_rgba(32,214,107,0.1)]"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    includeTimestamp
                      ? "bg-brand-green/20 text-brand-green"
                      : "bg-white/5 text-white/40"
                  )}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white block">
                    Kèm mốc thời gian đang xem
                  </span>
                  <span className="text-[11px] text-white/50 block truncate">
                    {includeTimestamp && capturedTime > 5 ? (
                      <>
                        Phát ngay tại mốc{" "}
                        <strong className="text-brand-green font-mono">
                          {formatSeconds(capturedTime)}
                        </strong>
                      </>
                    ) : (
                      "Bắt đầu phát từ đầu tập phim"
                    )}
                  </span>
                </div>
              </div>

              {/* iOS Style Switch */}
              <div
                className={cn(
                  "w-11 h-6 rounded-full transition-colors p-0.5 relative shrink-0 ml-2",
                  includeTimestamp ? "bg-brand-green" : "bg-white/20"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full transition-transform shadow-md",
                    includeTimestamp ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                  )}
                />
              </div>
            </button>

            {/* URL Preview & Copy Button */}
            <div className="mb-4">
              <div className="flex items-center gap-2 bg-black/70 border border-white/15 focus-within:border-brand-green/50 rounded-2xl p-1.5 transition-colors">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="bg-transparent border-none outline-none text-xs text-white/75 px-3 py-1.5 w-full font-mono select-all truncate"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  size="sm"
                  className={cn(
                    "rounded-xl font-bold text-xs px-3.5 py-2 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95",
                    copied
                      ? "bg-brand-green text-black hover:bg-brand-green/90"
                      : "bg-white/10 hover:bg-brand-green hover:text-black text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Sao chép</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Social Channels */}
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-wider text-white/40 font-bold block mb-2.5">
                Chia sẻ nhanh qua mạng xã hội
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialShare("facebook")}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-white/[0.03] hover:bg-[#1877f2]/20 hover:border-[#1877f2]/50 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#1877f2] flex items-center justify-center font-bold text-sm shadow-md text-white group-hover:scale-105 transition-transform">
                    f
                  </div>
                  <span className="text-[10px] font-semibold text-white/70 group-hover:text-white">
                    Facebook
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialShare("zalo")}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-white/[0.03] hover:bg-[#0068ff]/20 hover:border-[#0068ff]/50 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0068ff] flex items-center justify-center font-black text-xs shadow-md text-white group-hover:scale-105 transition-transform">
                    Zalo
                  </div>
                  <span className="text-[10px] font-semibold text-white/70 group-hover:text-white">
                    Zalo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialShare("telegram")}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-white/[0.03] hover:bg-[#229ed9]/20 hover:border-[#229ed9]/50 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#229ed9] flex items-center justify-center text-sm shadow-md text-white group-hover:scale-105 transition-transform">
                    ✈
                  </div>
                  <span className="text-[10px] font-semibold text-white/70 group-hover:text-white">
                    Telegram
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialShare("twitter")}
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-white/[0.03] hover:bg-white/15 hover:border-white/30 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-black border border-white/30 flex items-center justify-center font-black text-xs shadow-md text-white group-hover:scale-105 transition-transform">
                    𝕏
                  </div>
                  <span className="text-[10px] font-semibold text-white/70 group-hover:text-white">
                    X / Twitter
                  </span>
                </button>
              </div>
            </div>

            {/* Native mobile share if supported */}
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-2xl bg-brand-green/15 hover:bg-brand-green/25 border border-brand-green/35 text-brand-green font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span className="truncate">Gửi qua ứng dụng (Zalo, Messenger, AirDrop...)</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


