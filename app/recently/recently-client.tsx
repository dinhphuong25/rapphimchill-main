"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import Link from "next/link";
import Image from "next/image";
import { Play, Trash2, Clock, Film } from "lucide-react";
import { useLoading } from "@/components/ui/loading-context";
import { useWatchHistory } from "@/hooks/useLocalStorage";

interface WatchedMovie {
  slug: string;
  name: string;
  poster_url?: string;
  thumb_url?: string;
  year?: string | number;
  quality?: string;
  timestamp?: number;
  watchedAt?: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

function RecentlyMovieCard({
  movie,
  index,
  onRemove,
}: {
  movie: WatchedMovie;
  index: number;
  onRemove: (slug: string) => void;
}) {
  const { showLoading } = useLoading();
  const poster = movie.poster_url || movie.thumb_url;
  const imgUrl = poster?.startsWith("http")
    ? poster
    : `https://phimimg.com/${poster}`;

  return (
    <div
      className="group relative flex flex-col"
      style={{
        opacity: 0,
        animation: `fadeSlideUp 0.4s ease forwards`,
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <Link
        href={`/watch?slug=${movie.slug}`}
        onClick={() => showLoading()}
        prefetch={false}
        className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-cinema-surface border border-white/10 group-hover:border-brand-green/40 transition-all duration-300 group-hover:-translate-y-1.5 shadow-lg group-hover:shadow-brand-green/10"
      >
        <Image
          src={imgUrl}
          alt={movie.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized={true}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

        {movie.quality && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-cinema-bg/85 backdrop-blur-md text-white border border-white/15">
            {movie.quality}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <div className="w-14 h-14 rounded-full bg-brand-green/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-brand-green/40 scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 text-cinema-bg ml-0.5" fill="currentColor" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <p className="text-white text-xs sm:text-sm font-bold leading-tight line-clamp-2">
            {movie.name}
          </p>
        </div>
      </Link>

      <div className="mt-2.5 px-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-cinema-text-muted font-medium">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(movie.watchedAt || movie.timestamp || Date.now())}</span>
          {movie.year && <span className="ml-1">· {movie.year}</span>}
        </div>

        <button
          onClick={() => onRemove(movie.slug)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400"
          aria-label="Xóa khỏi lịch sử"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function RecentlyWatchedClient({ categories, countries }: any) {
  const { history, removeFromHistory, clearHistory, hydrated } = useWatchHistory();
  const movies = history as unknown as WatchedMovie[];

  const handleRemove = useCallback((slug: string) => {
    removeFromHistory(slug);
  }, [removeFromHistory]);

  const handleClearAll = () => {
    clearHistory();
  };

  if (!hydrated) {
    return <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[225px] transition-all duration-300"></main>;
  }

  return (
    <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[225px] transition-all duration-300">
      <Sidebar categories={categories} countries={countries} />
      <Header categories={categories} countries={countries} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-16 sm:pt-20 pb-16">
        <h1 className="sr-only">Lịch Sử Xem</h1>

        {movies.length > 0 && (
          <div className="flex justify-end mb-3 sm:mb-4">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg transition-colors hover:bg-red-400/10 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa lịch sử
            </button>
          </div>
        )}

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-cinema-surface border border-white/10 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-lg font-bold mb-1">Chưa có phim nào</p>
              <p className="text-cinema-text-muted text-sm">Bắt đầu xem phim và lịch sử sẽ xuất hiện ở đây</p>
            </div>
            <Link
              href="/"
              className="mt-2 px-5 py-2.5 bg-brand-green text-cinema-bg font-extrabold rounded-xl hover:bg-brand-green-hover transition-colors text-sm"
            >
              Khám phá phim
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((movie, i) => (
              <RecentlyMovieCard
                key={movie.slug}
                movie={movie}
                index={i}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
