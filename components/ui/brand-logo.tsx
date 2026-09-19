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
    sm: "text-[17px] sm:text-[19px]",
    md: "text-[21px] sm:text-[23px]",
    lg: "text-[26px] sm:text-[30px]",
  }[size];

  return (
    <div
      className={cn(
        "flex items-center select-none group transition-transform duration-200 active:scale-[0.98]",
        className
      )}
    >
      <span
        className={cn(
          "font-black uppercase tracking-tighter leading-none flex items-baseline font-sans",
          sizeClasses
        )}
      >
        {/* HI — Crisp Stark White */}
        <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-colors group-hover:text-white">
          HI
        </span>

        {/* PHIM — Signature Emerald Green with Neon Cinematic Glow */}
        <span className="ml-[1.5px] text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#25e876] to-emerald-400 drop-shadow-[0_0_14px_rgba(32,214,107,0.55)] group-hover:drop-shadow-[0_0_20px_rgba(32,214,107,0.85)] transition-all duration-300">
          PHIM
        </span>

        {/* Signature Dot . — Matching Onflix Aesthetic with Hi Phim Green Accent */}
        <span className="text-brand-green font-black ml-[1px] drop-shadow-[0_0_8px_rgba(32,214,107,0.85)] inline-block">
          .
        </span>
      </span>
    </div>
  );
}
