"use client";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({
  className,
  size = "md",
}: BrandLogoProps) {
  const sizeClasses = {
    sm: "text-[18px] sm:text-[20px]",
    md: "text-[23px] sm:text-[25px]",
    lg: "text-[28px] sm:text-[32px]",
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center select-none group transition-transform duration-200 active:scale-[0.97]",
        className
      )}
    >
      {/* Subtle Ambient Glow Behind Logo on Hover */}
      <div className="absolute -inset-x-2 -inset-y-1 bg-gradient-to-r from-transparent via-brand-green/15 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300" />

      {/* Main Stylized Wordmark — Condensed Cinema Typography (Oswald) */}
      <span
        className={cn(
          "font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wider leading-none flex items-baseline z-10",
          sizeClasses
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
      </span>
    </div>
  );
}
