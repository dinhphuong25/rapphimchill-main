"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Sidebar from "@/components/sidebar";
import { getFavoriteMovies } from "@/lib/user-experience";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import { Heart, Film } from "lucide-react";
import Link from "next/link";

export default function FavoritesClient({ categories, countries }: any) {
  const [movies, setMovies] = useState<any[]>([]);

  useEffect(() => {
    setMovies(getFavoriteMovies());
    const onStorageChange = () => setMovies(getFavoriteMovies());
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  return (
    <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[200px] transition-all duration-300">
      <Sidebar categories={categories} countries={countries} />
      <Header categories={categories} countries={countries} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          <div className="w-10 h-10 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center">
            <Heart className="w-5 h-5 text-brand-green fill-brand-green" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider">Phim Yêu Thích</h1>
            <p className="text-cinema-text-muted text-xs sm:text-sm mt-1 font-medium">
              {movies.length > 0 ? `${movies.length} phim đã lưu` : "Bộ sưu tập phim của bạn"}
            </p>
          </div>
        </div>

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
