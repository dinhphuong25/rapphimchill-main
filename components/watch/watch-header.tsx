"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Check, Copy, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WatchHeaderProps {
  movieName: string;
  movieSlug: string;
  currentEpName?: string;
  currentTime?: number;
  episodeIndex?: number;
}

const formatShareTime = (seconds: number) => {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/watch?slug=${encodeURIComponent(movieSlug)}`;
    const epParam = `&ep=${episodeIndex}`;
    const timeParam =
      includeTimestamp && currentTime > 5
        ? `&t=${Math.floor(currentTime)}`
        : "";
    return `${base}${epParam}${timeParam}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép liên kết xem phim!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${movieName} - Xem trên Hi Phim`,
          text: `Xem phim ${movieName} ${currentEpName ? `(${currentEpName})` : ""} chất lượng cao tại Hi Phim:`,
          url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full max-w-[1600px] mx-auto transition-all shrink-0">
        <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-3xl px-3 sm:px-6 py-2.5 relative">
          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
            {/* Left: Back button (Far left corner) */}
            <Button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              variant="ghost"
              size="sm"
              className="text-white/85 hover:text-white hover:bg-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border border-white/10 shrink-0 cursor-pointer shadow-sm active:scale-95"
              title="Quay lại"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">Trở về</span>
            </Button>

            {/* Right: Movie Title, Episode info & Share button (Far right corner) */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 text-xs sm:text-sm ml-auto text-right">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-white/90 font-semibold truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[340px] md:max-w-[500px] lg:max-w-[700px]">
                  {movieName}
                </span>
                {currentEpName && (
                  <>
                    <span className="text-white/30 shrink-0">/</span>
                    <span className="text-brand-green font-bold truncate max-w-[65px] sm:max-w-[120px] shrink-0">
                      {currentEpName}
                    </span>
                  </>
                )}
              </div>

              {/* Share button */}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95 shadow-sm"
                title="Chia sẻ phim"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-green" />
                <span className="hidden sm:inline text-xs font-semibold">Chia sẻ</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0e1410] border border-brand-green/30 rounded-2xl sm:rounded-3xl p-5 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">Chia sẻ phim</h4>
                  <p className="text-[11px] text-white/60 line-clamp-1">{movieName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timestamp Option */}
            {currentTime > 5 && (
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                  className="w-4 h-4 accent-[#20d66b] rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs text-white/90">
                  <Clock className="w-3.5 h-3.5 text-brand-green" />
                  <span>Kèm mốc thời gian đang xem</span>
                  <span className="font-mono text-brand-green font-bold">({formatShareTime(currentTime)})</span>
                </div>
              </label>
            )}

            {/* Copy Link Input */}
            <div className="flex items-center gap-2 bg-black/50 border border-white/15 rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent px-2 text-xs text-white/80 select-all outline-none font-mono"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="bg-brand-green hover:bg-brand-green-hover text-black font-bold text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </Button>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-[#1877f2]/15 hover:bg-[#1877f2]/25 border border-[#1877f2]/30 text-xs font-semibold text-center text-[#1877f2] transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(movieName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9]/25 border border-[#229ed9]/30 text-xs font-semibold text-center text-[#229ed9] transition-colors"
              >
                Telegram
              </a>
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-center text-white transition-colors cursor-pointer"
              >
                Khác...
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
