"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function BrandIconComponent({ className, size = "md" }: BrandIconProps) {
  const pixelSize = {
    sm: 22,
    md: 28,
    lg: 38,
    xl: 56,
  }[size];

  const sizeMap = {
    sm: "w-[22px] h-[22px] min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px]",
    md: "w-[27px] h-[27px] sm:w-[28px] sm:h-[28px] min-w-[27px] min-h-[27px] sm:min-w-[28px] sm:min-h-[28px] max-w-[27px] max-h-[27px] sm:max-w-[28px] sm:max-h-[28px]",
    lg: "w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] max-w-[36px] max-h-[36px] sm:max-w-[38px] sm:max-h-[38px]",
    xl: "w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] max-w-[52px] max-h-[52px] sm:max-w-[56px] sm:max-h-[56px]",
  };

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none group-hover:scale-105 transition-transform duration-200 aspect-square",
        sizeMap[size],
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        width={pixelSize}
        height={pixelSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-full max-h-full block shrink-0 relative z-10"
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
            <stop offset="70%" stopColor="#00F5A0" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
          </linearGradient>

          {/* Top Arc Gradient */}
          <linearGradient id="hp-arc-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#20D66B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#20D66B" />
          </linearGradient>

          {/* Core Disc Dark Cinema Radial */}
          <radialGradient id="hp-disc-grad" cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#0f2618" />
            <stop offset="70%" stopColor="#07150d" />
            <stop offset="100%" stopColor="#030805" />
          </radialGradient>

          {/* Play Triangle Metallic/White Shimmer */}
          <linearGradient id="hp-play-grad" x1="20%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
        </defs>

        {/* 1. Kinetic Outer Orbit Swoosh */}
        <path
          d="M 5 11 C 3 17 5 24 11 27.5 C 16.5 30.5 24 28.5 27.5 23.5"
          stroke="url(#hp-orbit-grad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 2. Kinetic Upper Accent Arc */}
        <path
          d="M 10 4.5 C 16 3 23 4.5 27 9"
          stroke="url(#hp-arc-top-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="12 3"
        />

        {/* 3. Orbital Satellite Spark */}
        <circle
          cx="27.5"
          cy="23.5"
          r="1.4"
          fill="#00F5A0"
        />

        {/* 4. Central Cinema Disc Core */}
        <circle
          cx="16"
          cy="16"
          r="10.5"
          fill="url(#hp-disc-grad)"
          stroke="url(#hp-emerald-grad)"
          strokeWidth="1.2"
        />

        {/* 5. Inner Optical Aperture Ring */}
        <circle
          cx="16"
          cy="16"
          r="8"
          stroke="#20D66B"
          strokeWidth="0.6"
          strokeOpacity="0.35"
          strokeDasharray="2 2.5"
        />

        {/* 6. Perfectly Centered Cinema Play Button */}
        <path
          d="M 13.8 12.2 C 13.8 11.5 14.6 11.1 15.2 11.4 L 19.8 15.2 C 20.3 15.6 20.3 16.4 19.8 16.8 L 15.2 20.6 C 14.6 20.9 13.8 20.5 13.8 19.8 Z"
          fill="url(#hp-play-grad)"
        />
      </svg>
    </div>
  );
}

export default memo(BrandIconComponent);
