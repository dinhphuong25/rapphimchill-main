"use client";

import { memo } from "react";

export const MovieCardSkeleton = memo(function MovieCardSkeleton() {
  return (
    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 skeleton-shimmer bg-gradient-to-r from-zinc-900 via-zinc-700/40 to-zinc-900" />
      {/* Badge placeholder */}
      <div className="absolute top-2 left-2 w-8 h-5 rounded bg-zinc-800" />
      {/* Info bar placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-zinc-900/80">
        <div className="h-3 bg-zinc-700 rounded w-4/5 mb-2" />
        <div className="h-2.5 bg-zinc-700 rounded w-3/5" />
      </div>
    </div>
  );
});

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SectionWithSkeleton({ title, count = 5 }: { title: string; count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 sm:w-1.5 h-5 sm:h-7 bg-zinc-700 rounded-full" />
        <h2 className="text-sm sm:text-xl font-bold text-zinc-600">{title}</h2>
      </div>
      <MovieGridSkeleton count={count} />
    </div>
  );
}
