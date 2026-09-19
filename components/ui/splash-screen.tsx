"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const dismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
    }, 350);
  }, []);

  useEffect(() => {
    // Elegant cinema intro: display for 850ms, then smoothly fade out
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 350);
    }, 850);

    return () => clearTimeout(timer);
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
      </div>
    </div>
  );
}
