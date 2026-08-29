"use client";

import { useWatchHistory } from "@/hooks/useLocalStorage";
import MovieSection from "@/components/movie-section";

interface RecentlyWatchedProps {
  limit?: number;
}

export default function RecentlyWatched({ limit }: RecentlyWatchedProps) {
  const { history, hydrated } = useWatchHistory();

  if (!hydrated || history.length === 0) return null;

  const movies = limit ? history.slice(0, limit) : history;

  return (
    <MovieSection
      indexNumber="00"
      title="Đã Xem Gần Đây"
      movies={movies}
      viewAllLink="/recently"
      variant="carousel"
    />
  );
}