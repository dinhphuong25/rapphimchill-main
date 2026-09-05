"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Flame, Film, Star, Clock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_KEYWORDS = [
  "Phim Bộ Trung Quốc",
  "Phim Hàn Quốc Hay",
  "Phim Hành Động 2026",
  "Anime Vietsub",
  "Phim Chiếu Rạp",
  "Phim Tình Cảm",
];

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Global hotkey: '/' or 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !isOpen) {
        // Prevent typing '/' into input if user is already typing in an input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Live search debounced 300ms
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=10`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          const items = data.data?.items || [];
          const cdnDomain = data.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
          const normalized = items.map((item: any) => ({
            ...item,
            thumb_url: item.thumb_url?.startsWith("http") ? item.thumb_url : `${cdnDomain}/${item.thumb_url}`,
            poster_url: item.poster_url?.startsWith("http") ? item.poster_url : `${cdnDomain}/${item.poster_url}`,
          }));
          setResults(normalized);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/phim/${results[selectedIndex].slug}`);
      onClose();
    } else if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-cinema-bg/95 backdrop-blur-2xl animate-fade-in">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 sm:pt-12">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0e1612]/95 border-2 border-brand-green/70 shadow-[0_0_30px_rgba(34,197,94,0.35)] relative">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3.5 flex-1 mr-2 sm:mr-4">
            <span className="font-mono text-xl sm:text-2xl font-bold text-brand-green select-none drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">&gt;</span>
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder="Tìm kiếm phim, đạo diễn, diễn viên..."
              className="w-full bg-transparent text-base sm:text-xl font-bold text-white placeholder:text-white/40 focus:outline-none font-sans"
            />
            {isLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green animate-spin shrink-0" />}
          </form>
          <button
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all shrink-0 active:scale-95"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="hidden sm:flex items-center justify-between text-[11px] font-mono text-white/40 mt-2.5 px-1">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">↑↓</kbd> Di chuyển</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">Enter</kbd> Chọn</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">ESC</kbd> Đóng</span>
          </div>
          <span className="text-brand-green/80">Command Palette v2.0</span>
        </div>
      </div>

      {/* Results / Suggestions Container */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 overflow-y-auto custom-scrollbar">
        {query.trim().length === 0 ? (
          /* Trending searches */
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-brand-green uppercase tracking-widest flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4" />
                Từ Khóa Tìm Kiếm Phổ Biến
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {TRENDING_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      setQuery(kw);
                      router.push(`/search?query=${encodeURIComponent(kw)}`);
                      onClose();
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-brand-green/15 border border-white/10 hover:border-brand-green/30 rounded-xl text-[11px] sm:text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1.5 sm:gap-2"
                  >
                    <span>{kw}</span>
                    <ArrowRight className="w-3 h-3 text-white/40" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length > 0 ? (
          /* Live Results Grid */
          <div className="space-y-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-3">
              Kết Quả Gợi Ý ({results.length})
            </span>
            {results.map((movie, idx) => (
              <Link
                key={movie.slug}
                href={`/phim/${movie.slug}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 group",
                  idx === selectedIndex
                    ? "bg-brand-green/15 border-brand-green/40 text-white"
                    : "bg-white/4 hover:bg-white/8 border-white/6 hover:border-white/15"
                )}
              >
                <div className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden bg-cinema-surface shrink-0 border border-white/10">
                  <Image
                    src={movie.poster_url || movie.thumb_url || ""}
                    alt={movie.name}
                    fill
                    quality={70}
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white group-hover:text-brand-green transition-colors truncate">
                    {movie.name}
                  </h4>
                  {movie.origin_name && (
                    <p className="text-xs text-white/50 truncate mb-1">{movie.origin_name}</p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    {movie.year && <span>{movie.year}</span>}
                    {movie.quality && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-semibold">
                        {movie.quality}
                      </span>
                    )}
                    {movie.episode_current && <span>{movie.episode_current}</span>}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30 group-hover:text-brand-green transition-colors" />
              </Link>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="py-16 text-center">
            <p className="text-white/50 text-sm">Không tìm thấy kết quả phù hợp với "{query}"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
