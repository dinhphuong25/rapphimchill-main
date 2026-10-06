"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isMerged, setIsMerged] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);
  const [progress, setProgress] = useState(0);

  const dismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
    }, 350);
  }, []);

  useEffect(() => {
    // Phase 1: Trigger the merge animation of logo and name
    const tMerge = setTimeout(() => {
      setIsMerged(true);
    }, 80);

    // Phase 2: Reveal the cinema slogan right after logo & name lock together
    const tSlogan = setTimeout(() => {
      setShowSlogan(true);
    }, 420);

    // Phase 3: Smooth progress fill
    const tProgress = setTimeout(() => {
      setProgress(100);
    }, 120);

    // Phase 4: Smooth cinema fade out to enter the app
    const tFade = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 350);
    }, 1200);

    return () => {
      clearTimeout(tMerge);
      clearTimeout(tSlogan);
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
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black select-none cursor-pointer transition-opacity duration-350 ease-out overflow-hidden",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center text-center px-6">
        {/* ======================================================== */}
        {/* HIỆU ỨNG GHÉP BIỂU TƯỢNG LOGO VÀ PHẦN TÊN (BRAND LOCKUP)  */}
        {/* ======================================================== */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-4 md:gap-4.5">
          {/* Biểu tượng Logo — Trượt từ bên trái vào tâm ghép với tên */}
          <div
            className={cn(
              "w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 relative transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu",
              isMerged
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 -translate-x-8 sm:-translate-x-10 scale-90"
            )}
          >
            <Image
              src="/favicon.png"
              alt="Hi Phim"
              width={64}
              height={64}
              className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              priority
              unoptimized
            />
          </div>

          {/* Phần Tên: HI PHIM. — Trượt từ bên phải vào khít liền kề với logo */}
          <div
            className={cn(
              "flex items-baseline tracking-tight font-[family-name:var(--font-oswald)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase select-none leading-none transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu",
              isMerged
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-8 sm:translate-x-10 scale-95"
            )}
          >
            <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
              HI
            </span>
            <span className="ml-2 sm:ml-2.5 text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#2cf580] to-emerald-400">
              PHIM
            </span>
            <span className="text-brand-green font-black ml-0.5 sm:ml-1 inline-block">
              .
            </span>
          </div>
        </div>

        {/* Slogan: Xuất hiện mượt mà ngay khi logo và tên đã ghép nối */}
        <p
          className={cn(
            "mt-3 sm:mt-3.5 text-xs sm:text-[13px] font-medium text-white/50 tracking-[0.3em] sm:tracking-[0.35em] uppercase transition-all duration-500 ease-out transform-gpu select-none",
            showSlogan
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          )}
        >
          ĐIỆN ẢNH KHÔNG GIỚI HẠN
        </p>

        {/* Minimalist Hairline Progress Bar */}
        <div className="mt-6 sm:mt-7 w-36 sm:w-44 h-[2px] rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-900 ease-out shadow-[0_0_8px_rgba(32,214,107,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
