"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import BrandIcon from "@/components/ui/brand-icon";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  const dismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
    }, 350);
  }, []);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 750; // 750ms progress sweep

    let rafId: number;
    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentProgress);

      if (currentProgress < 100) {
        rafId = requestAnimationFrame(updateProgress);
      } else {
        // Complete sweep, hold for 120ms then smoothly dissolve
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setShow(false);
          }, 350);
        }, 120);
      }
    };

    rafId = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      onClick={dismiss}
      onTouchStart={dismiss}
      role="status"
      aria-label="Đang tải Hi Phim"
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050806] select-none cursor-pointer transition-all duration-350 ease-out",
        isFading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      )}
    >
      {/* Ambient Cinema Radial Aura */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.14) 0%, rgba(5, 8, 6, 0.94) 55%, #050806 100%)",
        }}
      />

      {/* Subtle background film scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.025] pointer-events-none" />

      {/* Centerpiece Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-400 fill-mode-forwards">
        {/* Brand Icon Emblem */}
        <BrandIcon size="xl" className="mb-4 sm:mb-5 drop-shadow-[0_0_25px_rgba(32,214,107,0.5)]" />

        {/* Brand Logo: HI PHIM. */}
        <div className="flex items-baseline tracking-normal font-oswald text-5xl sm:text-6xl md:text-7xl font-black text-white select-none">
          <span className="tracking-tight drop-shadow-[0_2px_20px_rgba(255,255,255,0.18)]">
            HI PHIM
          </span>
          <span className="text-brand-green font-black ml-0.5 text-6xl sm:text-7xl md:text-8xl leading-none drop-shadow-[0_0_24px_rgba(34,197,94,0.9)] animate-pulse">
            .
          </span>
        </div>

        {/* Cinema Slogan: ĐIỆN ẢNH KHÔNG GIỚI HẠN */}
        <p className="mt-3 sm:mt-3.5 text-xs sm:text-sm md:text-[15px] font-semibold text-white/75 uppercase tracking-[0.32em] sm:tracking-[0.42em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
          ĐIỆN ẢNH KHÔNG GIỚI HẠN
        </p>

        {/* Signature Emerald Laser Progress Bar */}
        <div className="relative mt-8 sm:mt-9 w-36 sm:w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-brand-green to-emerald-300 rounded-full shadow-[0_0_14px_rgba(34,197,94,0.95)] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tap to skip hint */}
        <span className="mt-6 text-[10px] text-white/25 uppercase tracking-widest pointer-events-none">
          Chạm để bỏ qua
        </span>
      </div>
    </div>
  );
}
