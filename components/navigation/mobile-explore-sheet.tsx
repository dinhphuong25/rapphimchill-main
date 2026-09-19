"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Tv,
  Film,
  Clapperboard,
  Cat,
  Flame,
  Globe,
  Calendar,
  Trophy,
  Hash,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { instantMovieStore } from "@/lib/instant-movie-store";

interface MobileExploreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCategories: () => void;
  onOpenCountries: () => void;
  onOpenYears: () => void;
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
}

const EXPLORE_CARDS: ExploreCard[] = [
  {
    id: "categories",
    label: "Chủ đề",
    subtitle: "24+ Thể loại",
    icon: Hash,
    action: "categories",
    gradient: "from-[#2b1709] via-[#1b0f05] to-[#110903]",
    fadeOverlay: "from-[#1b0f05] via-[#1b0f05]/60 to-transparent",
    border: "border-amber-500/25 hover:border-amber-500/50",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "phim-bo",
    label: "Phim Bộ",
    subtitle: "Truyền hình đặc sắc",
    icon: Tv,
    href: "/?typeList=phim-bo",
    typeList: "phim-bo",
    gradient: "from-[#0c1f38] via-[#081526] to-[#040c17]",
    fadeOverlay: "from-[#081526] via-[#081526]/60 to-transparent",
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
    fadeOverlay: "from-[#051c10] via-[#051c10]/60 to-transparent",
    border: "border-emerald-500/25 hover:border-emerald-500/50",
    iconColor: "text-brand-green",
    iconBg: "bg-brand-green/15",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "phim-han",
    label: "Phim Hàn",
    subtitle: "K-Drama lãng mạn",
    icon: Globe,
    href: "/?country=han-quoc",
    gradient: "from-[#1d1338] via-[#130c26] to-[#0a0614]",
    fadeOverlay: "from-[#130c26] via-[#130c26]/60 to-transparent",
    border: "border-indigo-500/25 hover:border-indigo-500/50",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "phim-trung",
    label: "Phim Trung",
    subtitle: "Cổ trang kiếm hiệp",
    icon: Globe,
    href: "/?country=trung-quoc",
    gradient: "from-[#330f14] via-[#240a0e] to-[#140608]",
    fadeOverlay: "from-[#240a0e] via-[#240a0e]/60 to-transparent",
    border: "border-rose-500/25 hover:border-rose-500/50",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "hoat-hinh",
    label: "Hoạt Hình",
    subtitle: "Anime & 3D Đồ Họa",
    icon: Cat,
    href: "/?typeList=hoat-hinh",
    typeList: "hoat-hinh",
    gradient: "from-[#2d1e08] via-[#1f1505] to-[#120c03]",
    fadeOverlay: "from-[#1f1505] via-[#1f1505]/60 to-transparent",
    border: "border-amber-500/25 hover:border-amber-500/50",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "phim-chieu-rap",
    label: "Chiếu Rạp",
    subtitle: "Hot nhất hiện nay",
    icon: Clapperboard,
    href: "/?typeList=phim-chieu-rap",
    typeList: "phim-chieu-rap",
    gradient: "from-[#0a272b] via-[#061b1e] to-[#031012]",
    fadeOverlay: "from-[#061b1e] via-[#061b1e]/60 to-transparent",
    border: "border-cyan-500/25 hover:border-cyan-500/50",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "phim-au-my",
    label: "Phim Âu Mỹ",
    subtitle: "Hollywood đỉnh cao",
    icon: Globe,
    href: "/?country=au-my",
    gradient: "from-[#111e38] via-[#0b1424] to-[#060b14]",
    fadeOverlay: "from-[#0b1424] via-[#0b1424]/60 to-transparent",
    border: "border-sky-500/25 hover:border-sky-500/50",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/15",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "countries",
    label: "Quốc Gia",
    subtitle: "18+ Quốc gia",
    icon: Globe,
    action: "countries",
    gradient: "from-[#0d2823] via-[#081a17] to-[#040e0c]",
    fadeOverlay: "from-[#081a17] via-[#081a17]/60 to-transparent",
    border: "border-teal-500/25 hover:border-teal-500/50",
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/15",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "years",
    label: "Năm Chiếu",
    subtitle: "Từ 2000 đến nay",
    icon: Calendar,
    action: "years",
    gradient: "from-[#28180d] via-[#1a1008] to-[#0f0904]",
    fadeOverlay: "from-[#1a1008] via-[#1a1008]/60 to-transparent",
    border: "border-orange-500/25 hover:border-orange-500/50",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/15",
    image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "new-updates",
    label: "Mới Cập Nhật",
    subtitle: "Tập mới mỗi ngày",
    icon: Flame,
    href: "/new-updates",
    gradient: "from-[#331309] via-[#210c05] to-[#120602]",
    fadeOverlay: "from-[#210c05] via-[#210c05]/60 to-transparent",
    border: "border-orange-600/25 hover:border-orange-600/50",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-600/15",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=320&auto=format&fit=crop&q=80",
  },
  {
    id: "bang-xep-hang",
    label: "Xếp Hạng",
    subtitle: "Top phim xem nhiều",
    icon: Trophy,
    href: "/bang-xep-hang",
    gradient: "from-[#282008] via-[#1c1605] to-[#100d02]",
    fadeOverlay: "from-[#1c1605] via-[#1c1605]/60 to-transparent",
    border: "border-amber-400/25 hover:border-amber-400/50",
    iconColor: "text-amber-300",
    iconBg: "bg-amber-400/15",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=320&auto=format&fit=crop&q=80",
  },
];

export default function MobileExploreSheet({
  isOpen,
  onClose,
  onOpenCategories,
  onOpenCountries,
  onOpenYears,
}: MobileExploreSheetProps) {
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
        className="relative z-10 w-full max-h-[85dvh] flex flex-col bg-[#0B100E] border-t border-white/10 rounded-t-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out"
      >
        {/* Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-2 shrink-0 cursor-pointer" onClick={onClose} />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pb-3 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                Khám Phá
              </h2>
              <p className="text-[11px] text-white/50">
                Kho phim điện ảnh, truyền hình & anime
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer active:scale-95"
            aria-label="Đóng bảng Khám Phá"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 custom-scrollbar pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {EXPLORE_CARDS.map((card) => {
              const Icon = card.icon;

              const content = (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-3 h-[78px] sm:h-21 flex flex-col justify-between group active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
                    card.border
                  )}
                >
                  {/* Background Gradient */}
                  <div className={cn("absolute inset-0 bg-gradient-to-r", card.gradient)} />

                  {/* Right Character / Movie Artwork with Gradient Fade */}
                  <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none overflow-hidden select-none">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover object-center opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
                      sizes="180px"
                    />
                    <div className={cn("absolute inset-0 bg-gradient-to-r", card.fadeOverlay)} />
                  </div>

                  {/* Top Item: Icon + Title */}
                  <div className="relative z-10 flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
                        card.iconBg,
                        card.iconColor
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black text-[13.5px] sm:text-sm text-white tracking-tight truncate drop-shadow-sm">
                      {card.label}
                    </span>
                  </div>

                  {/* Bottom Item: Subtitle */}
                  <div className="relative z-10">
                    <span className="text-[10px] sm:text-[11px] text-white/55 font-medium tracking-tight group-hover:text-white/80 transition-colors">
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
                    className="w-full text-left"
                  >
                    {content}
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
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
