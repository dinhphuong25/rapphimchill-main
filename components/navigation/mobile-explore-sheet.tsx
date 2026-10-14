"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { instantMovieStore } from "@/lib/instant-movie-store";

interface MobileExploreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCategories: () => void;
  onOpenCountries: () => void;
  onOpenYears: () => void;
  categoriesCount?: number;
  countriesCount?: number;
}

interface ExploreCard {
  id: string;
  label: string;
  href?: string;
  action?: "categories" | "countries" | "years";
  gradient: string;
  border: string;
  image: string;
  typeList?: string;
}

export default function MobileExploreSheet({
  isOpen,
  onClose,
  onOpenCategories,
  onOpenCountries,
  onOpenYears,
}: MobileExploreSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 10 Balanced Cards (5 Pairs) — Styled cleanly with centered typography
  const CARDS: ExploreCard[] = [
    {
      id: "home",
      label: "Trang Chủ",
      href: "/",
      gradient: "from-[#082317] via-[#0d2d1f] to-[#123827]",
      border: "border-emerald-500/30 hover:border-brand-green/60",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-chieu-rap",
      label: "Chiếu Rạp",
      href: "/?typeList=phim-chieu-rap",
      typeList: "phim-chieu-rap",
      gradient: "from-[#280c12] via-[#351018] to-[#42141f]",
      border: "border-rose-500/30 hover:border-rose-500/60",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-bo",
      label: "Phim Bộ",
      href: "/?typeList=phim-bo",
      typeList: "phim-bo",
      gradient: "from-[#0c1d3b] via-[#112448] to-[#172c57]",
      border: "border-sky-500/30 hover:border-sky-500/60",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-le",
      label: "Phim Lẻ",
      href: "/?typeList=phim-le",
      typeList: "phim-le",
      gradient: "from-[#08291b] via-[#0b3323] to-[#0f3d2b]",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "hoat-hinh",
      label: "Hoạt Hình",
      href: "/?typeList=hoat-hinh",
      typeList: "hoat-hinh",
      gradient: "from-[#291b06] via-[#352308] to-[#422c0a]",
      border: "border-amber-500/30 hover:border-amber-500/60",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "new-updates",
      label: "Mới Cập Nhật",
      href: "/new-updates",
      gradient: "from-[#082924] via-[#0b332d] to-[#0f3d36]",
      border: "border-teal-500/30 hover:border-teal-500/60",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "categories",
      label: "Thể Loại",
      action: "categories",
      gradient: "from-[#280f08] via-[#34140a] to-[#41190d]",
      border: "border-amber-500/30 hover:border-amber-500/60",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "countries",
      label: "Quốc Gia",
      action: "countries",
      gradient: "from-[#0a2624] via-[#0d312e] to-[#113d39]",
      border: "border-teal-500/30 hover:border-teal-500/60",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "years",
      label: "Năm Phát Hành",
      action: "years",
      gradient: "from-[#26170c] via-[#311e10] to-[#3d2514]",
      border: "border-orange-500/30 hover:border-orange-500/60",
      image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "tai-app",
      label: "Tải App",
      href: "/tai-app",
      gradient: "from-[#1d1135] via-[#271447] to-[#32175c]",
      border: "border-purple-500/30 hover:border-purple-500/60",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&auto=format&fit=crop&q=85",
    },
  ];

  // Lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Check scroll ability to guide user
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    const checkScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setCanScrollDown(remaining > 30);
    };

    const timer = setTimeout(checkScroll, 120);
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleScrollDown = () => {
    scrollRef.current?.scrollBy({ top: 200, behavior: "smooth" });
  };

  return (
    <div
      className="lg:hidden fixed inset-0 z-[150] flex items-end justify-center select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Bottom Sheet Container */}
      <div
        id="mobile-explore-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu khám phá danh mục"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-h-[88dvh] sm:max-h-[85vh] flex flex-col bg-[#0B100E] border-t border-white/10 rounded-t-[28px] sm:rounded-t-[32px] shadow-[0_-12px_48px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out"
      >
        {/* Pull Handle */}
        <div
          className="w-10 h-1 rounded-full bg-white/25 mx-auto mt-2.5 mb-2 shrink-0 cursor-pointer"
          onClick={onClose}
        />

        {/* Sheet Header — Clean, Bold Onflix Style */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3.5 border-b border-white/8 shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
            Khám Phá
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Đóng bảng Khám Phá"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Cards Grid Container */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto pr-1 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch p-3 sm:p-4 pb-10 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {CARDS.map((card) => {
              const cardContent = (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border h-[68px] sm:h-[72px] flex items-center justify-center p-3 group active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.6)] select-none",
                    card.border
                  )}
                >
                  {/* High Clarity Background Cinematic Image */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover object-center opacity-75 group-hover:opacity-90 group-hover:scale-108 transition-all duration-500"
                      sizes="240px"
                    />
                  </div>

                  {/* Gentle Themed Gradient Tint */}
                  <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50 group-hover:opacity-40 transition-opacity", card.gradient)} />

                  {/* Balanced Vignette — Keeps Background Art Visible while Maximizing Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/60 pointer-events-none" />

                  {/* Top Ambient Subtle Highlight */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25 pointer-events-none" />

                  {/* Centered Typography: Balanced, Bright & Highly Legible */}
                  <div className="relative z-10 flex items-center justify-center text-center px-2 w-full">
                    <span className="font-black text-[15px] sm:text-[16px] text-white tracking-tight leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,1)] [text-shadow:_0_1px_8px_rgb(0_0_0_/_90%),_0_2px_16px_rgb(0_0_0_/_90%)] group-hover:text-brand-green group-hover:scale-[1.03] transition-all duration-200 truncate">
                      {card.label}
                    </span>
                  </div>
                </div>
              );

              if (card.action) {
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (card.action === "categories") onOpenCategories();
                      if (card.action === "countries") onOpenCountries();
                      if (card.action === "years") onOpenYears();
                    }}
                    className="w-full text-left"
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link
                  key={card.id}
                  href={card.href || "/"}
                  scroll={false}
                  onClick={onClose}
                  onTouchStart={() => {
                    if (card.typeList) instantMovieStore.prefetch(card.typeList);
                  }}
                  onMouseEnter={() => {
                    if (card.typeList) instantMovieStore.prefetch(card.typeList);
                  }}
                  className="w-full"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scroll Helper button at bottom */}
        {canScrollDown && (
          <button
            type="button"
            onClick={handleScrollDown}
            className="absolute bottom-3 right-4 z-20 px-2.5 py-1 rounded-full bg-black/85 hover:bg-black border border-brand-green/40 text-brand-green text-[10.5px] font-bold flex items-center gap-1 shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md active:scale-95 transition-all animate-bounce"
            aria-label="Cuộn xem tiếp"
          >
            <span>Xem tiếp</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
