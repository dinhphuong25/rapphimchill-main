import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Film, Play, PlayCircle, Hash, Info, Video } from "lucide-react";
import PhimApi from "@/libs/phimapi.com";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import { getCachedCategories, getCachedCountries } from "@/lib/data";

import TrailerButtonWithModal from "@/components/movie/trailer-modal";
import MovieSynopsis from "@/components/movie/movie-synopsis";

const getMovie = async (slug: string) => {
  return unstable_cache(
    async () => {
      const api = new PhimApi();
      return api.get(slug);
    },
    [`phim-detail-${slug}`],
    { revalidate: 3600 } // 1 hour caching for movie detail
  )();
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const { movie } = await getMovie(slug);
    
    const posterUrl = movie.poster_url?.startsWith("http")
      ? movie.poster_url
      : `https://phimimg.com/${movie.poster_url}`;

    return {
      title: `${movie.name} - Xem phim HD`,
      description: movie.content?.substring(0, 160) || `Xem phim ${movie.name} HD miễn phí tại Hi Phim`,
      openGraph: {
        title: movie.name,
        description: movie.content?.substring(0, 200),
        images: [{ url: posterUrl, width: 300, height: 450, alt: movie.name }],
      },
      alternates: { canonical: `https://hiphim.biz/phim/${slug}` },
    };
  } catch {
    return { title: "Phim" };
  }
}

import { LoadingMovieDetail } from "@/components/ui/page-loaders";

export default async function PhimDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (HIDDEN_MOVIE_SLUGS.includes(slug)) notFound();

  return (
    <Suspense fallback={<LoadingMovieDetail />}>
      <PhimDetailContent slug={slug} />
    </Suspense>
  );
}

async function PhimDetailContent({ slug }: { slug: string }) {
  let movie: any, episodes: any[];
  try {
    const data = await getMovie(slug);
    movie = data.movie;
    episodes = data.server || (data as any).episodes || [];
  } catch {
    notFound();
  }

  const [categories, countries] = await Promise.all([
    getCachedCategories(),
    getCachedCountries(),
  ]);

  const posterUrl = movie.poster_url?.startsWith("http")
    ? movie.poster_url
    : `https://phimimg.com/${movie.poster_url}`;

  const cleanContent = movie.content
    ? movie.content
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
    : "";

  const totalEpisodes = episodes?.[0]?.server_data?.length || 0;

  return (
    <main className="min-h-screen bg-[#0a0c0e] text-cinema-text lg:pl-[225px] transition-all duration-300 flex flex-col justify-center">
      <Sidebar categories={categories as any[]} countries={countries as any[]} />

      {/* Main Container - Centered and balanced in viewport with guaranteed bottom dock clearance */}
      <div className="w-full max-w-[960px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-6 pb-28 sm:pb-8 lg:pb-6 flex flex-col justify-center my-auto flex-1">
        
        {/* Prominent Featured Hero Card */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#131915] via-[#0d120f] to-[#070b09] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(32,214,107,0.08)]">
          
          {/* Subtle glowing background aura */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-green/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Hero Card Content */}
          <div className="relative z-10 p-3.5 xs:p-4.5 sm:p-5 lg:p-6 xl:p-7">
            
            {/* Poster on left, Movie Info on right — Vertically Centered & Balanced */}
            <div className="flex flex-row gap-3.5 sm:gap-6 lg:gap-7 items-center">
              
              {/* Poster Image: Balanced and prominent */}
              <div className="relative w-[115px] xs:w-[130px] sm:w-44 md:w-48 lg:w-[195px] xl:w-[215px] shrink-0 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_16px_45px_rgba(0,0,0,0.9),0_0_25px_rgba(32,214,107,0.18)] ring-1 sm:ring-2 ring-brand-green/40 group">
                <Image
                  src={posterUrl}
                  alt={movie.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 140px, (max-width: 1024px) 210px, 250px"
                  unoptimized={true}
                  priority
                />
                {movie.quality && (
                  <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-brand-green to-emerald-400 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-md sm:rounded-lg shadow-sm">
                    {movie.quality}
                  </span>
                )}
              </div>

              {/* Movie Info Details: Balanced & Centered */}
              <div className="flex-1 flex flex-col items-start justify-center text-left min-w-0 py-0.5">
                {/* Title */}
                <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl xl:text-[28px] font-black text-white leading-snug lg:leading-tight mb-0.5 lg:mb-1 line-clamp-2 tracking-tight">
                  {movie.name}
                </h1>

                {/* Subtitle */}
                {movie.origin_name && (
                  <p className="text-white/55 text-[11px] xs:text-xs sm:text-xs lg:text-sm font-medium mb-2 lg:mb-2.5 line-clamp-1 italic">
                    {movie.origin_name}
                  </p>
                )}

                {/* Meta Badges & Category Chips: Unified cohesive row */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 lg:gap-2 mb-2 lg:mb-2.5 text-[10px] xs:text-xs font-semibold">
                  {movie.year && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/10 rounded-full text-white/90 border border-white/15">
                      {movie.year}
                    </span>
                  )}
                  {movie.time && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/10 rounded-full text-white/90 border border-white/15">
                      {movie.time}
                    </span>
                  )}
                  {totalEpisodes > 0 && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-brand-green/20 text-brand-green border border-brand-green/40 rounded-full font-bold">
                      {totalEpisodes} tập
                    </span>
                  )}
                  {movie.chieurap && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                      Chiếu rạp
                    </span>
                  )}
                  {movie.category?.map((cat: any) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/?category=${cat.slug || cat.id}`}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/[0.08] hover:bg-brand-green hover:text-black border border-white/10 hover:border-brand-green/50 text-white/80 rounded-lg transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                {/* Action Buttons: Symmetrical & Prominent */}
                <div className="flex items-center gap-2 sm:gap-3 my-1.5 sm:my-2 w-full lg:w-auto">
                  {episodes?.[0]?.server_data?.[0] && (
                    <Link
                      href={`/watch?slug=${slug}`}
                      className="flex-1 sm:flex-initial h-9 xs:h-10 sm:h-10.5 lg:h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 bg-brand-green hover:bg-[#1bc660] text-black font-black text-xs sm:text-sm rounded-xl active:scale-95 transition-all shadow-[0_0_18px_rgba(32,214,107,0.4)] select-none"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black shrink-0" />
                      <span className="whitespace-nowrap">Xem Phim</span>
                    </Link>
                  )}
                  
                  <TrailerButtonWithModal
                    movieName={movie.name}
                    trailerUrl={movie.trailer_url}
                    compact={true}
                    className="flex-1 sm:flex-initial h-9 xs:h-10 sm:h-10.5 lg:h-11 lg:px-5 lg:text-sm"
                  />
                </div>

                {/* Desktop Synopsis: Inlined inside right column for perfect desktop balance */}
                <div className="hidden lg:block w-full mt-1.5">
                  <MovieSynopsis content={cleanContent} variant="inline" />
                </div>

              </div>
            </div>

            {/* Mobile Synopsis: Full width underneath poster & info */}
            <div className="lg:hidden">
              <MovieSynopsis content={cleanContent} variant="default" />
            </div>

          </div>
        </div>
      </div>

      {/* SEO structured data */}
      <MovieStructuredData movie={movie} url={`https://hiphim.biz/phim/${slug}`} />
      <BreadcrumbStructuredData
        items={[
          { name: "Trang Chủ", url: "https://hiphim.biz" },
          { name: movie.name, url: `https://hiphim.biz/phim/${slug}` },
        ]}
      />
    </main>
  );
}
