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
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialShare("facebook")}
                  className="flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-2xl bg-white/[0.03] hover:bg-[#1877f2]/10 hover:border-[#1877f2]/40 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-lg shadow-[#1877F2]/25 group-hover:scale-110 group-hover:shadow-[#1877F2]/45 transition-all duration-200 shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                    </svg>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-white/75 group-hover:text-white transition-colors">
                    Facebook
                  </span>
                </button>

                {/* Zalo */}
                <button
                  type="button"
                  onClick={() => handleSocialShare("zalo")}
                  className="flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-2xl bg-white/[0.03] hover:bg-[#0068ff]/10 hover:border-[#0068ff]/40 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-[#0068FF]/25 group-hover:scale-110 group-hover:shadow-[#0068FF]/45 transition-all duration-200 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 50 50" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M22.782 0.166H27.199C33.265 0.166 36.81 1.057 39.957 2.744C43.104 4.431 45.588 6.896 47.256 10.043C48.943 13.19 49.834 16.735 49.834 22.801V27.199C49.834 33.265 48.943 36.81 47.256 39.957C45.568 43.104 43.104 45.588 39.957 47.256C36.81 48.943 33.265 49.834 27.199 49.834H22.801C16.735 49.834 13.19 48.943 10.043 47.256C6.896 45.569 4.412 43.104 2.744 39.957C1.057 36.81 0.166 33.265 0.166 27.199V22.801C0.166 16.735 1.057 13.19 2.744 10.043C4.431 6.896 6.896 4.412 10.043 2.744C13.171 1.057 16.735 0.166 22.782 0.166Z" fill="#0068FF"/>
                      <path opacity="0.12" fillRule="evenodd" clipRule="evenodd" d="M49.834 26.474V27.199C49.834 33.266 48.943 36.811 47.256 39.958C45.568 43.105 43.104 45.588 39.957 47.256C36.81 48.943 33.265 49.834 27.199 49.834H22.801C17.837 49.834 14.561 49.238 11.81 48.097L7.275 43.427L49.834 26.474Z" fill="#001A33"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.779 43.589C10.102 43.846 13.006 43.184 15.068 42.183C24.023 47.132 38.02 46.895 46.492 41.473C46.821 40.98 47.128 40.468 47.413 39.936C49.106 36.778 50 33.22 50 27.132V22.718C50 16.629 49.106 13.071 47.413 9.913C45.739 6.754 43.246 4.281 40.088 2.588C36.929 0.894 33.371 0 27.283 0H22.85C17.664 0 14.298 0.653 11.47 1.899C11.315 2.037 11.164 2.178 11.015 2.321C2.717 10.32 2.087 27.659 9.123 37.078C9.131 37.092 9.139 37.106 9.149 37.12C10.233 38.719 9.187 41.515 7.551 43.152C7.284 43.399 7.379 43.551 7.779 43.589Z" fill="white"/>
                      <path d="M20.563 17H10.838V19.085H17.587L10.933 27.332C10.724 27.635 10.573 27.919 10.573 28.564V29.095H19.748C20.203 29.095 20.582 28.716 20.582 28.261V27.142H13.492L19.748 19.294C19.843 19.18 20.013 18.972 20.089 18.877L20.127 18.82C20.487 18.289 20.563 17.834 20.563 17.284V17Z" fill="#0068FF"/>
                      <path d="M32.942 29.095H34.326V17H32.24V28.393C32.24 28.773 32.544 29.095 32.942 29.095Z" fill="#0068FF"/>
                      <path d="M25.814 19.692C23.198 19.692 21.075 21.816 21.075 24.432C21.075 27.048 23.198 29.171 25.814 29.171C28.43 29.171 30.553 27.048 30.553 24.432C30.572 21.816 28.449 19.692 25.814 19.692ZM25.814 27.218C24.279 27.218 23.027 25.967 23.027 24.432C23.027 22.896 24.279 21.645 25.814 21.645C27.35 21.645 28.601 22.896 28.601 24.432C28.601 25.967 27.369 27.218 25.814 27.218Z" fill="#0068FF"/>
                      <path d="M40.487 19.616C37.852 19.616 35.71 21.758 35.71 24.393C35.71 27.028 37.852 29.171 40.487 29.171C43.122 29.171 45.264 27.028 45.264 24.393C45.264 21.758 43.122 19.616 40.487 19.616ZM40.487 27.218C38.932 27.218 37.681 25.967 37.681 24.412C37.681 22.858 38.932 21.607 40.487 21.607C42.041 21.607 43.292 22.858 43.292 24.412C43.292 25.967 42.041 27.218 40.487 27.218Z" fill="#0068FF"/>
                      <path d="M29.456 29.094H30.575V19.957H28.622V28.279C28.622 28.715 29.001 29.094 29.456 29.094Z" fill="#0068FF"/>
                    </svg>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-white/75 group-hover:text-white transition-colors">
                    Zalo
                  </span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleSocialShare("telegram")}
                  className="flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-2xl bg-white/[0.03] hover:bg-[#1d93d2]/10 hover:border-[#1d93d2]/40 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-[#1D93D2]/25 group-hover:scale-110 group-hover:shadow-[#1D93D2]/45 transition-all duration-200 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 240 240" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="tg-gradient-share" x1="120" y1="240" x2="120" y2="0" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#1D93D2" />
                          <stop offset="1" stopColor="#38B0E3" />
                        </linearGradient>
                      </defs>
                      <rect width="240" height="240" fill="url(#tg-gradient-share)" />
                      <path
                        d="M81.229 128.772l14.237 39.406s1.78 3.687 3.686 3.687 30.255-29.492 30.255-29.492l31.525-60.89-69.17 37.289z"
                        fill="#C8DAEA"
                      />
                      <path
                        d="M100.106 138.878l-2.733 29.046s-1.144 8.9 7.754 0 17.415-15.763 17.415-15.763"
                        fill="#A9C6D8"
                      />
                      <path
                        d="M81.486 130.178L52.2 120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229 2.1-2.2 6.489-4.523 120.106-45.36 120.106-45.36s3.208-1.081 5.1-.362a2.766 2.766 0 011.885 2.055c.238.825.254 2.585.254 2.585s-.009.752-.169 2.542c-.692 11.165-21.4 94.493-21.4 94.493s-1.239 4.876-5.678 5.043a8.13 8.13 0 01-4.725-2.652c-8.711-7.493-38.819-27.727-45.472-32.177a1.27 1.27 0 01-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6 53.821-51.492c.108-.379-.3-.566-.848-.4-3.482 1.281-63.844 39.4-70.506 43.607a3.21 3.21 0 01-4.354-2.046z"
                        fill="#FFFFFF"
                      />
                    </svg>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-white/75 group-hover:text-white transition-colors">
                    Telegram
                  </span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleSocialShare("twitter")}
                  className="flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-2xl bg-white/[0.03] hover:bg-white/10 hover:border-white/30 border border-white/10 text-white transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-lg shadow-white/5 group-hover:scale-110 group-hover:border-white/40 group-hover:shadow-white/10 transition-all duration-200 shrink-0">
                    <svg viewBox="0 0 300 271" className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z" />
                    </svg>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-white/75 group-hover:text-white transition-colors">
                    X (Twitter)
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


