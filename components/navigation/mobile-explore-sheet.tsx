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
  History,
  Heart,
  Sparkles,
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
  subtitle: string;
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
  colSpan?: 1 | 2;
}

interface ExploreGroup {
  id: string;
  title: string;
  cards: ExploreCard[];
}

export default function MobileExploreSheet({
  isOpen,
  onClose,
  onOpenCategories,
  onOpenCountries,
  onOpenYears,
  categoriesCount = 24,
  countriesCount = 18,
}: MobileExploreSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Grouped cards synchronized 100% with Desktop Sidebar
  const GROUPS: ExploreGroup[] = [
    {
      id: "menu-chinh",
      title: "MENU CHÍNH",
      cards: [
        {
          id: "home",
          label: "Trang Chủ",
          subtitle: "Trang chủ Hi Phim",
          icon: Home,
          href: "/",
          gradient: "from-[#0c2419] via-[#071710] to-[#040e0a]",
          fadeOverlay: "from-[#071710] via-[#071710]/70 to-transparent",
          border: "border-emerald-500/25 hover:border-emerald-500/50",
          iconColor: "text-brand-green",
          iconBg: "bg-brand-green/15",
          image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "phim-chieu-rap",
          label: "Chiếu Rạp",
          subtitle: "Hot nhất hiện nay",
          icon: Clapperboard,
          href: "/?typeList=phim-chieu-rap",
          typeList: "phim-chieu-rap",
          gradient: "from-[#0a272b] via-[#061b1e] to-[#031012]",
          fadeOverlay: "from-[#061b1e] via-[#061b1e]/70 to-transparent",
          border: "border-cyan-500/25 hover:border-cyan-500/50",
          iconColor: "text-cyan-400",
          iconBg: "bg-cyan-500/15",
          image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "phim-bo",
          label: "Phim Bộ",
          subtitle: "Truyền hình đặc sắc",
          icon: Tv,
          href: "/?typeList=phim-bo",
          typeList: "phim-bo",
          gradient: "from-[#0c1f38] via-[#081526] to-[#040c17]",
          fadeOverlay: "from-[#081526] via-[#081526]/70 to-transparent",
          border: "border-blue-500/25 hover:border-blue-500/50",
          iconColor: "text-sky-400",
          iconBg: "bg-blue-500/15",
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "phim-le",
          label: "Phim Lẻ",
          subtitle: "Bom tấn điện ảnh",
          icon: Film,
          href: "/?typeList=phim-le",
          typeList: "phim-le",
          gradient: "from-[#092918] via-[#051c10] to-[#031109]",
          fadeOverlay: "from-[#051c10] via-[#051c10]/70 to-transparent",
          border: "border-emerald-500/25 hover:border-emerald-500/50",
          iconColor: "text-brand-green",
          iconBg: "bg-brand-green/15",
          image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "hoat-hinh",
          label: "Hoạt Hình",
          subtitle: "Anime & 3D Đồ Họa",
          icon: Cat,
          href: "/?typeList=hoat-hinh",
          typeList: "hoat-hinh",
          gradient: "from-[#2d1e08] via-[#1f1505] to-[#120c03]",
          fadeOverlay: "from-[#1f1505] via-[#1f1505]/70 to-transparent",
          border: "border-amber-500/25 hover:border-amber-500/50",
          iconColor: "text-amber-400",
          iconBg: "bg-amber-500/15",
          image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "new-updates",
          label: "Mới Cập Nhật",
          subtitle: "Tập mới mỗi ngày",
          icon: Flame,
          href: "/new-updates",
          gradient: "from-[#331309] via-[#210c05] to-[#120602]",
          fadeOverlay: "from-[#210c05] via-[#210c05]/70 to-transparent",
          border: "border-orange-500/25 hover:border-orange-500/50",
          iconColor: "text-orange-400",
          iconBg: "bg-orange-500/15",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=320&auto=format&fit=crop&q=80",
        },
      ],
    },
    {
      id: "kham-pha",
      title: "KHÁM PHÁ",
      cards: [
        {
          id: "categories",
          label: "Thể Loại",
          subtitle: `${categoriesCount}+ Thể loại phim`,
          icon: Layers,
          action: "categories",
          gradient: "from-[#2b1709] via-[#1b0f05] to-[#110903]",
          fadeOverlay: "from-[#1b0f05] via-[#1b0f05]/70 to-transparent",
          border: "border-amber-500/25 hover:border-amber-500/50",
          iconColor: "text-amber-400",
          iconBg: "bg-amber-500/15",
          image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "countries",
          label: "Quốc Gia",
          subtitle: `${countriesCount}+ Quốc gia toàn cầu`,
          icon: Globe,
          action: "countries",
          gradient: "from-[#0d2823] via-[#081a17] to-[#040e0c]",
          fadeOverlay: "from-[#081a17] via-[#081a17]/70 to-transparent",
          border: "border-teal-500/25 hover:border-teal-500/50",
          iconColor: "text-teal-400",
          iconBg: "bg-teal-500/15",
          image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "years",
          label: "Năm Phát Hành",
          subtitle: "Từ năm 2000 đến nay",
          icon: Calendar,
          action: "years",
          gradient: "from-[#28180d] via-[#1a1008] to-[#0f0904]",
          fadeOverlay: "from-[#1a1008] via-[#1a1008]/70 to-transparent",
          border: "border-orange-500/25 hover:border-orange-500/50",
          iconColor: "text-orange-400",
          iconBg: "bg-orange-500/15",
          image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=320&auto=format&fit=crop&q=80",
          colSpan: 2,
        },
      ],
    },
    {
      id: "ca-nhan",
      title: "CÁ NHÂN",
      cards: [
        {
          id: "recently",
          label: "Lịch Sử Xem",
          subtitle: "Phim đã xem gần đây",
          icon: History,
          href: "/recently",
          gradient: "from-[#111e38] via-[#0b1424] to-[#060b14]",
          fadeOverlay: "from-[#0b1424] via-[#0b1424]/70 to-transparent",
          border: "border-sky-500/25 hover:border-sky-500/50",
          iconColor: "text-sky-400",
          iconBg: "bg-sky-500/15",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80",
        },
        {
          id: "favorites",
          label: "Phim Yêu Thích",
          subtitle: "Bộ sưu tập của bạn",
          icon: Heart,
          href: "/favorites",
          gradient: "from-[#330f14] via-[#240a0e] to-[#140608]",
          fadeOverlay: "from-[#240a0e] via-[#240a0e]/70 to-transparent",
          border: "border-rose-500/25 hover:border-rose-500/50",
          iconColor: "text-rose-400",
          iconBg: "bg-rose-500/15",
          image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&auto=format&fit=crop&q=80",
        },
      ],
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
      setCanScrollDown(remaining > 40);
    };

    const timer = setTimeout(checkScroll, 150);
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
    scrollRef.current?.scrollBy({ top: 220, behavior: "smooth" });
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
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-[#0B100E] border-t border-white/10 rounded-t-[26px] sm:rounded-t-[30px] shadow-[0_-12px_48px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out"
      >
        {/* Pull Handle */}
        <div
          className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 mb-1.5 shrink-0 cursor-pointer"
          onClick={onClose}
        />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight truncate">
                Menu & Khám Phá
              </h2>
              <p className="text-[11px] text-white/50 tracking-tight truncate">
                Đồng bộ đầy đủ các mục như trên máy tính
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Đóng bảng Menu"
          >
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Groups Container with modal-scroll enabled */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto pr-1 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch p-3 sm:p-4 space-y-4 pb-12 pb-[max(3rem,calc(env(safe-area-inset-bottom)+2rem))]"
        >
          {GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              {/* Group Section Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-white/45 uppercase tracking-wider">
                  {group.title}
                </span>
                <span className="text-[9px] font-bold text-white/30 tracking-tight">
                  {group.cards.length} MỤC
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {group.cards.map((card) => {
                  const Icon = card.icon;

                  const cardContent = (
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-xl sm:rounded-2xl border p-2.5 sm:p-3 h-[60px] sm:h-[66px] flex flex-col justify-between group active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
                        card.border,
                        card.colSpan === 2 ? "col-span-2" : "col-span-1"
                      )}
                    >
                      {/* Background Gradient */}
                      <div className={cn("absolute inset-0 bg-gradient-to-r", card.gradient)} />

                      {/* Right Character / Movie Artwork with Gradient Fade */}
                      <div
                        className={cn(
                          "absolute right-0 top-0 bottom-0 pointer-events-none overflow-hidden select-none",
                          card.colSpan === 2 ? "w-[40%]" : "w-[48%]"
                        )}
                      >
                        <Image
                          src={card.image}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover object-center opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                          sizes={card.colSpan === 2 ? "320px" : "180px"}
                        />
                        <div className={cn("absolute inset-0 bg-gradient-to-r", card.fadeOverlay)} />
                      </div>

                      {/* Top Item: Icon + Title */}
                      <div className="relative z-10 flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className={cn(
                            "w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
                            card.iconBg,
                            card.iconColor
                          )}
                        >
                          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="font-black text-[12.5px] sm:text-[13px] text-white tracking-tight truncate drop-shadow-sm">
                          {card.label}
                        </span>
                      </div>

                      {/* Bottom Item: Subtitle */}
                      <div className="relative z-10">
                        <span className="text-[9.5px] sm:text-[10.5px] text-white/55 font-medium tracking-tight group-hover:text-white/80 transition-colors truncate block">
                          {card.subtitle}
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
                        className={cn(
                          "w-full text-left",
                          card.colSpan === 2 ? "col-span-2" : "col-span-1"
                        )}
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
                      className={cn(
                        "w-full",
                        card.colSpan === 2 ? "col-span-2" : "col-span-1"
                      )}
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Helper floating cue at bottom when more items exist */}
        {canScrollDown && (
          <button
            type="button"
            onClick={handleScrollDown}
            className="absolute bottom-3 right-4 z-20 px-2.5 py-1 rounded-full bg-black/85 hover:bg-black border border-brand-green/40 text-brand-green text-[10.5px] font-bold flex items-center gap-1 shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md active:scale-95 transition-all animate-bounce"
            aria-label="Cuộn xem tiếp"
          >
            <span>Xem thêm</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
