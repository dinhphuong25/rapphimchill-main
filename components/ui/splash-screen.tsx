"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  const dismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
    }, 300);
  }, []);

  useEffect(() => {
    const tProgress = setTimeout(() => {
      setProgress(100);
    }, 40);

    const tFade = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 300);
    }, 800);

    return () => {
      clearTimeout(tProgress);
      clearTimeout(tFade);
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
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black select-none cursor-pointer transition-opacity duration-300 ease-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center text-center px-6 animate-in fade-in duration-300">
        {/* Brand Icon — Clean, sharp, minimalist */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 mb-3.5 relative">
          <Image
            src="/favicon.png"
            alt="Hi Phim"
            width={56}
            height={56}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Wordmark: HI PHIM. */}
        <div className="flex items-baseline tracking-tight font-[family-name:var(--font-oswald)] text-4xl sm:text-5xl md:text-6xl font-bold text-white select-none leading-none">
          <span>HI</span>
          <span className="ml-2 sm:ml-2.5">PHIM</span>
          <span className="text-brand-green font-black ml-0.5 sm:ml-1 inline-block">
            .
          </span>
        </div>

        {/* Slogan */}
        <p className="mt-3 text-xs sm:text-[13px] font-medium text-white/50 tracking-[0.3em] uppercase">
          ĐIỆN ẢNH KHÔNG GIỚI HẠN
        </p>

        {/* Minimalist Progress Line */}
        <div className="mt-6 w-36 sm:w-44 h-[2px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
