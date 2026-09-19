"use client";

import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function BrandIcon({ className, size = "md" }: BrandIconProps) {
  const pixelSize = {
    sm: 24,
    md: 30,
    lg: 40,
    xl: 64,
  }[size];

  // Use explicit min/max dimensions to prevent SVG flex blowout on any browser
  const sizeMap = {
    sm: "w-[24px] h-[24px] min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px]",
    md: "w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] min-w-[30px] min-h-[30px] sm:min-w-[32px] sm:min-h-[32px] max-w-[30px] max-h-[30px] sm:max-w-[32px] sm:max-h-[32px]",
    lg: "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] max-w-[38px] max-h-[38px] sm:max-w-[42px] sm:max-h-[42px]",
    xl: "w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] min-w-[60px] min-h-[60px] sm:min-w-[68px] sm:min-h-[68px] max-w-[60px] max-h-[60px] sm:max-w-[68px] sm:max-h-[68px]",
  };

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none group-hover:scale-105 transition-transform duration-300 aspect-square",
        sizeMap[size],
        className
      )}
    >
      {/* Ambient Radial Aura Glow */}
      <div className="absolute inset-0 rounded-full bg-brand-green/25 blur-xs opacity-70 group-hover:opacity-100 group-hover:bg-brand-green/35 transition-all duration-300 pointer-events-none" />

      <svg
        viewBox="0 0 44 44"
        width={pixelSize}
        height={pixelSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-full max-h-full block shrink-0 relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <defs>
          {/* Main Brand Emerald Gradient */}
          <linearGradient id="hp-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" />
            <stop offset="50%" stopColor="#20D66B" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Sweeping Orbit Gradient */}
          <linearGradient id="hp-orbit-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#20D66B" />
            <stop offset="60%" stopColor="#00F5A0" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
          </linearGradient>

          {/* Secondary Top Arc Gradient */}
          <linearGradient id="hp-arc-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#20D66B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#20D66B" />
          </linearGradient>

          {/* Core Disc Dark Cinema Radial */}
          <radialGradient id="hp-disc-grad" cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#11291b" />
            <stop offset="65%" stopColor="#08140e" />
            <stop offset="100%" stopColor="#030805" />
          </radialGradient>

          {/* Play Triangle Metallic/Neon Shimmer */}
          <linearGradient id="hp-play-grad" x1="15%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E2FBEB" />
            <stop offset="100%" stopColor="#20D66B" />
          </linearGradient>

          {/* Soft Neon Glow Filter */}
          <filter id="hp-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Kinetic Outer Orbit Swoosh (Lower-left wrapping around the core) */}
        <path
          d="M 8.5 15.5 C 6 23.5 9 32.5 17 37 C 24.5 40.5 33.5 38 38 31.5"
          stroke="url(#hp-orbit-grad)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* 2. Kinetic Upper Counter-Arc (Film reel rotation accent) */}
        <path
          d="M 15 7.5 C 22 5 30.5 6.5 36 12 C 38.5 14.5 40 18 40.5 21.5"
          stroke="url(#hp-arc-top-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="16 3"
        />

        {/* 3. Glowing Orbital Satellite Dot / Spark */}
        <circle
          cx="38"
          cy="31.5"
          r="1.75"
          fill="#00F5A0"
          filter="url(#hp-neon-glow)"
          className="animate-pulse"
        />

        {/* 4. Central Cinema Disc Core */}
        <circle
          cx="22"
          cy="22"
          r="12"
          fill="url(#hp-disc-grad)"
          stroke="url(#hp-emerald-grad)"
          strokeWidth="1.4"
          className="drop-shadow-[0_0_8px_rgba(32,214,107,0.35)]"
        />

        {/* 5. Inner Optical Aperture Ring */}
        <circle
          cx="22"
          cy="22"
          r="9.5"
          stroke="#20D66B"
          strokeWidth="0.75"
          strokeOpacity="0.3"
          strokeDasharray="2 3"
        />

        {/* 6. Signature Cinema Play Button */}
        <path
          d="M 19 16.4 C 19 15.6 19.9 15.1 20.6 15.5 L 27.2 19.3 C 27.9 19.7 27.9 20.7 27.2 21.1 L 20.6 24.9 C 19.9 25.3 19 24.8 19 24.0 Z"
          fill="url(#hp-play-grad)"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.9))"
        />
      </svg>
    </div>
  );
}
