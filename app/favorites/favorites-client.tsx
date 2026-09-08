"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Sidebar from "@/components/sidebar";
import { useFavorites } from "@/hooks/useLocalStorage";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import { Film } from "lucide-react";
import Link from "next/link";

export default function FavoritesClient({ categories, countries }: any) {
  const { favorites, hydrated } = useFavorites();
  const movies = favorites;

  if (!hydrated) {
    return <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[225px] transition-all duration-300"></main>;
  }

  return (
    <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[225px] transition-all duration-300">
      <Sidebar categories={categories} countries={countries} />
      <Header categories={categories} countries={countries} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-16 sm:pt-20 pb-16">
        <h1 className="sr-only">Phim Yêu Thích</h1>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-cinema-surface border border-white/10 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-lg font-bold mb-1">Chưa có phim nào</p>
              <p className="text-cinema-text-muted text-sm">Hãy lưu những bộ phim bạn yêu thích để xem lại sau</p>
            </div>
            <Link href="/" className="mt-2 px-5 py-2.5 bg-brand-green text-cinema-bg font-extrabold rounded-xl hover:bg-brand-green-hover transition-colors text-sm">
              Khám phá phim
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((movie: any) => (
              <MovieCardEditorial key={movie.slug} movie={movie} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
