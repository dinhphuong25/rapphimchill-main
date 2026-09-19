"use client";

import { cn } from "@/lib/utils";
import BrandIcon from "./brand-icon";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  slogan?: string;
  showSlogan?: boolean;
  showIcon?: boolean;
}

export default function BrandLogo({
  className,
  size = "md",
  slogan = "Điện ảnh không giới hạn",
  showSlogan = true,
  showIcon = true,
}: BrandLogoProps) {
  const titleSizeClasses = {
    sm: "text-[16px] sm:text-[17px]",
    md: "text-[19px] sm:text-[21px]",
    lg: "text-[27px] sm:text-[30px]",
  }[size];

  const sloganSizeClasses = {
    sm: "text-[8px] sm:text-[8.5px] tracking-[0.04em]",
    md: "text-[8.5px] sm:text-[9.5px] tracking-[0.05em]",
    lg: "text-[11px] sm:text-[12px] tracking-[0.08em]",
  }[size];

  const gapClasses = {
    sm: "gap-2",
    md: "gap-2.5",
    lg: "gap-3",
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center select-none group transition-all duration-200 active:scale-[0.98] shrink-0",
        gapClasses,
        className
      )}
    >
      {/* Ambient Glow behind entire logo lockup on hover */}
      <div className="absolute -inset-x-3 -inset-y-1.5 bg-gradient-to-r from-brand-green/10 via-brand-green/15 to-transparent rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300" />

      {/* Bespoke Cinema Emblem Icon */}
      {showIcon && (
        <BrandIcon size={size} className="shrink-0" />
      )}

      {/* Brand Identity Text Block (Wordmark + Slogan) */}
      <div className="flex flex-col justify-center min-w-0 z-10 text-left shrink-0">
        {/* Main Stylized Wordmark — Condensed Cinema Typography (Oswald) */}
        <div
          className={cn(
            "font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider leading-none flex items-baseline",
            titleSizeClasses
          )}
        >
          {/* HI — Crisp Stark White with Beveled Depth */}
          <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-colors group-hover:text-white">
            HI
          </span>

          {/* PHIM — Electric Emerald Gradient with Neon Aura */}
          <span className="ml-1 sm:ml-1.5 text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#2cf580] to-emerald-400 drop-shadow-[0_0_14px_rgba(32,214,107,0.65)] group-hover:drop-shadow-[0_0_22px_rgba(32,214,107,0.95)] transition-all duration-300">
            PHIM
          </span>

          {/* Signature Dot . — Glowing Neon Emerald Dot */}
          <span className="text-brand-green font-black ml-[1.5px] drop-shadow-[0_0_10px_rgba(32,214,107,0.95)] inline-block">
            .
          </span>
        </div>

        {/* Subtitle / Slogan (Styled cleanly underneath, matching reference layout) */}
        {showSlogan && (
          <span
            className={cn(
              "font-medium text-white/60 group-hover:text-white/85 transition-colors leading-tight mt-0.5 sm:mt-1 select-none truncate",
              sloganSizeClasses
            )}
          >
            {slogan}
          </span>
        )}
      </div>
    </div>
  );
}

export { BrandIcon };
