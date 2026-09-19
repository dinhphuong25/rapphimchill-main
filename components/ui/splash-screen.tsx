"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

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
    // Start filling progress bar smoothly from 0% to 100%
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 40);

    // Elegant cinema intro: display for 850ms, then smoothly fade out
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 350);
    }, 850);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(fadeTimer);
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
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#000000] select-none cursor-pointer transition-all duration-350 ease-out",
        isFading ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      )}
    >
      {/* Subtle Cinema Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(32, 214, 107, 0.08) 0%, rgba(0, 0, 0, 0.95) 60%, #000000 100%)",
        }}
      />

      {/* Centerpiece Content — Minimalist, bold cinema identity matching Onflix reference */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-350 fill-mode-forwards">
        {/* Brand Logo: HI PHIM. — Proportional, crisp, and bold */}
        <div className="flex items-baseline tracking-tight font-[family-name:var(--font-oswald)] text-5xl sm:text-6xl md:text-7xl font-bold text-white select-none">
          <span>HI</span>
          <span className="ml-2 sm:ml-2.5">PHIM</span>
          {/* Proportional neon emerald dot, matching letter baseline */}
          <span className="text-brand-green font-black ml-1 inline-block">
            .
          </span>
        </div>

        {/* Cinema Slogan: ĐIỆN ẢNH KHÔNG GIỚI HẠN */}
        <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm md:text-[15px] font-semibold text-white uppercase tracking-[0.25em] sm:tracking-[0.35em]">
          ĐIỆN ẢNH KHÔNG GIỚI HẠN
        </p>

        {/* Sleek Cinema Progress Loading Bar */}
        <div className="mt-6 sm:mt-7 w-36 sm:w-48 h-1 sm:h-1.5 rounded-full bg-white/[0.08] overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-brand-green/30 via-brand-green to-[#2cf580] rounded-full transition-all duration-[800ms] ease-out shadow-[0_0_12px_rgba(32,214,107,0.7)] relative"
            style={{ width: `${progress}%` }}
          >
            {/* Laser leading tip */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/75 blur-[0.5px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
