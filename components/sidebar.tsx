"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Compass,
  Sparkles,
  Tv,
  Film,
  Clapperboard,
  Flame,
  Clock,
  Heart,
  ChevronRight,
  ChevronLeft,
  Globe,
  PlayCircle,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  isTheatreMode?: boolean;
}

const NAV_MAIN = [
  { href: "/", label: "Trang Chủ", icon: Home },
  { href: "/?typeList=phim-chieu-rap", label: "Chiếu Rạp", icon: Clapperboard, typeList: "phim-chieu-rap" },
  { href: "/?typeList=phim-bo", label: "Phim Bộ", icon: Tv, typeList: "phim-bo" },
  { href: "/?typeList=phim-le", label: "Phim Lẻ", icon: Film, typeList: "phim-le" },
  { href: "/?typeList=hoat-hinh", label: "Hoạt Hình", icon: Sparkles, typeList: "hoat-hinh" },
  { href: "/new-updates", label: "Mới Cập Nhật", icon: Flame },
];

const NAV_PERSONAL = [
  { href: "/recently", label: "Lịch Sử Xem", icon: Clock },
  { href: "/favorites", label: "Phim Yêu Thích", icon: Heart },
];

const NAV_QUICK_COUNTRIES = [
  { href: "/?country=han-quoc", label: "Hàn Quốc", code: "KR", country: "han-quoc" },
  { href: "/?country=trung-quoc", label: "Trung Quốc", code: "CN", country: "trung-quoc" },
  { href: "/?country=au-my", label: "Âu Mỹ", code: "US", country: "au-my" },
  { href: "/?country=viet-nam", label: "Việt Nam", code: "VN", country: "viet-nam" },
];

export default function Sidebar({ isTheatreMode = false }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore expanded preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rpc_sidebar_expanded");
      if (stored === "true") setIsExpanded(true);
    } catch {}
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rpc_sidebar_expanded", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, searchParams]);

  const isLinkActive = (href: string, typeList?: string, country?: string) => {
    if (country) {
      return pathname === "/" && searchParams.get("country") === country;
    }
    if (typeList) {
      return pathname === "/" && searchParams.get("typeList") === typeList;
    }
    if (href === "/") {
      return pathname === "/" && !searchParams.get("typeList") && !searchParams.get("country") && !searchParams.get("category");
    }
    return pathname.startsWith(href);
  };

  // If in Theatre Mode during video watching, auto-hide sidebar
  if (isTheatreMode) return null;

  return (
    <>
      {/* Mobile Drawer Trigger (Only visible on small screens) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Mở Menu"
        className="lg:hidden fixed top-5 left-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/90 border border-white/5 text-white/80 hover:text-white backdrop-blur-xl shadow-inner"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[100] bg-cinema-sub border-r border-white/10 text-cinema-text flex flex-col transition-all duration-300 ease-out select-none",
          // Mobile state
          isMobileOpen ? "translate-x-0 w-[260px] z-[130]" : "-translate-x-full lg:translate-x-0",
          // Desktop sizing (Always Expanded)
          "lg:w-[200px]"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/8 shrink-0">
          <Link href="/" className="flex items-center gap-3 overflow-hidden group py-1">
            <Image
              src="/favicon.svg"
              alt="Rạp Phim Chill Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-black text-white tracking-wider font-sans">RẠP PHIM</span>
              <span className="text-[10px] font-black text-brand-green tracking-[0.3em] mt-0.5">CHILL</span>
            </div>
          </Link>

          {/* Toggle Expand Button — Desktop Removed */}

          {/* Close Button — Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng Menu"
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-hide">
          {/* Main Nav Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              MENU CHÍNH
            </span>

            {NAV_MAIN.map((item) => {
              const active = isLinkActive(item.href, item.typeList);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/15 to-transparent text-brand-green font-bold"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-green rounded-r-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className={cn("truncate transition-opacity duration-200", "opacity-100")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="editorial-line" />

          {/* Personal Group Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              CÁ NHÂN
            </span>

            {NAV_PERSONAL.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/15 to-transparent text-brand-green font-bold"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-green rounded-r-full shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className={cn("truncate transition-opacity duration-200", "opacity-100")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>


        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/8 shrink-0 text-center">
          <div className={cn("text-[10px] text-white/30 truncate transition-opacity duration-200", "opacity-100")}>
            © 2026 RẠP PHIM CHILL
          </div>
        </div>
      </aside>
    </>
  );
}
