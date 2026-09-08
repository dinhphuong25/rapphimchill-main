"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface Top10CardProps {
  movie: {
    slug: string;
    name: string;
    poster_url?: string;
    thumb_url?: string;
    year?: number;
    quality?: string;
  };
  rank: number; // 1 to 10
}

export const Top10Card = memo(function Top10Card({ movie, rank }: Top10CardProps) {
  const rawUrl = movie.poster_url || movie.thumb_url || "";
  const imageUrl = rawUrl.startsWith("http") ? rawUrl : (rawUrl ? `https://phimimg.com/${rawUrl}` : "");

  return (
    <div className="group relative flex items-center select-none pl-6 pr-2">
      {/* Giant Condensed Rank Number behind poster */}
      <span className="absolute left-0 bottom-2 text-7xl sm:text-8xl font-black italic tracking-tighter text-white/12 group-hover:text-brand-green/20 transition-colors pointer-events-none font-mono">
        {rank}
      </span>

      {/* Overlapping Poster Image */}
      <Link
        href={`/phim/${movie.slug}`}
        className="relative z-10 w-full aspect-[2/3] rounded-xl overflow-hidden bg-cinema-surface border border-white/10 group-hover:border-brand-green/50 transition-[transform,border-color,box-shadow] duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02] shadow-xl group-hover:shadow-[0_10px_30px_rgba(32,214,107,0.25)] ml-8 transform-gpu"
      >
        <Image
          src={imageUrl}
          alt={movie.name}
          fill
          sizes="(max-width: 640px) 45vw, 20vw"
          quality={75}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent opacity-80" />

        {/* TOP 10 Tag */}
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-black bg-brand-green text-cinema-bg">
          TOP {rank}
        </span>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-cinema-bg shadow-lg scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-cinema-bg ml-0.5" />
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <h4 className="text-xs font-bold text-white truncate">{movie.name}</h4>
        </div>
      </Link>
    </div>
  );
});

export default Top10Card;
