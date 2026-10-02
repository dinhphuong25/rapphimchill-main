"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Home,
  Tv,
  Film,
  Clapperboard,
  Cat,
  Flame,
  Globe,
  Calendar,
  Layers,
  Trophy,
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
  icon: any;
  href?: string;
  action?: "categories" | "countries" | "years";
  gradient: string;
  fadeOverlay: string;
  border: string;
  iconColor: string;
  iconBg: string;
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

  // 10 Balanced Cards (5 Pairs) — Styled identically to Onflix with Hi Phim brand colors
  const CARDS: ExploreCard[] = [
    {
      id: "home",
      label: "Trang Chủ",
      icon: Home,
      href: "/",
      gradient: "from-[#082317] via-[#0d2d1f] to-[#123827]",
      fadeOverlay: "from-[#082317] via-[#082317]/60 to-transparent",
      border: "border-emerald-500/30 hover:border-brand-green/60",
      iconColor: "text-brand-green",
      iconBg: "bg-brand-green/20",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-chieu-rap",
      label: "Chiếu Rạp",
      icon: Clapperboard,
      href: "/?typeList=phim-chieu-rap",
      typeList: "phim-chieu-rap",
      gradient: "from-[#280c12] via-[#351018] to-[#42141f]",
      fadeOverlay: "from-[#280c12] via-[#280c12]/60 to-transparent",
      border: "border-rose-500/30 hover:border-rose-500/60",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/20",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-bo",
      label: "Phim Bộ",
      icon: Tv,
      href: "/?typeList=phim-bo",
      typeList: "phim-bo",
      gradient: "from-[#0c1d3b] via-[#112448] to-[#172c57]",
      fadeOverlay: "from-[#0c1d3b] via-[#0c1d3b]/60 to-transparent",
      border: "border-sky-500/30 hover:border-sky-500/60",
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/20",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "phim-le",
      label: "Phim Lẻ",
      icon: Film,
      href: "/?typeList=phim-le",
      typeList: "phim-le",
      gradient: "from-[#08291b] via-[#0b3323] to-[#0f3d2b]",
      fadeOverlay: "from-[#08291b] via-[#08291b]/60 to-transparent",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "hoat-hinh",
      label: "Hoạt Hình",
      icon: Cat,
      href: "/?typeList=hoat-hinh",
      typeList: "hoat-hinh",
      gradient: "from-[#291b06] via-[#352308] to-[#422c0a]",
      fadeOverlay: "from-[#291b06] via-[#291b06]/60 to-transparent",
      border: "border-amber-500/30 hover:border-amber-500/60",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "new-updates",
      label: "Mới Cập Nhật",
      icon: Flame,
      href: "/new-updates",
      gradient: "from-[#301206] via-[#3d1808] to-[#4a1e0a]",
      fadeOverlay: "from-[#301206] via-[#301206]/60 to-transparent",
      border: "border-orange-500/30 hover:border-orange-500/60",
      iconColor: "text-orange-400",
      iconBg: "bg-orange-500/20",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "categories",
      label: "Thể Loại",
      icon: Layers,
      action: "categories",
      gradient: "from-[#280f08] via-[#34140a] to-[#41190d]",
      fadeOverlay: "from-[#280f08] via-[#280f08]/60 to-transparent",
      border: "border-amber-500/30 hover:border-amber-500/60",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "countries",
      label: "Quốc Gia",
      icon: Globe,
      action: "countries",
      gradient: "from-[#0a2624] via-[#0d312e] to-[#113d39]",
      fadeOverlay: "from-[#0a2624] via-[#0a2624]/60 to-transparent",
      border: "border-teal-500/30 hover:border-teal-500/60",
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/20",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "years",
      label: "Năm Phát Hành",
      icon: Calendar,
      action: "years",
      gradient: "from-[#26170c] via-[#311e10] to-[#3d2514]",
      fadeOverlay: "from-[#26170c] via-[#26170c]/60 to-transparent",
      border: "border-orange-500/30 hover:border-orange-500/60",
      iconColor: "text-orange-400",
      iconBg: "bg-orange-500/20",
      image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&auto=format&fit=crop&q=85",
    },
    {
      id: "bang-xep-hang",
      label: "Bảng Xếp Hạng",
      icon: Trophy,
      href: "/bang-xep-hang",
      gradient: "from-[#281f07] via-[#332809] to-[#3f320b]",
      fadeOverlay: "from-[#281f07] via-[#281f07]/60 to-transparent",
      border: "border-yellow-500/30 hover:border-yellow-500/60",
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20",
      image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=85",
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
              const Icon = card.icon;

              const cardContent = (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-3 h-[66px] sm:h-[70px] flex items-center justify-between group active:scale-[0.96] transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
                    card.border
                  )}
                >
                  {/* Background Gradient */}
                  <div className={cn("absolute inset-0 bg-gradient-to-r", card.gradient)} />

                  {/* Top Ambient Subtle Highlight */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/15 pointer-events-none" />

                  {/* Right Character / Movie Artwork with Gentle Artistic Fade */}
                  <div className="absolute right-0 top-0 bottom-0 w-[50%] pointer-events-none overflow-hidden select-none">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover object-center opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      sizes="200px"
                    />
                    <div className={cn("absolute inset-0 bg-gradient-to-r", card.fadeOverlay)} />
                  </div>

                  {/* Left Content: Icon Badge + Bold Title */}
                  <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
                        card.iconBg,
                        card.iconColor
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black text-[13.5px] sm:text-[14.5px] text-white tracking-tight truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
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
