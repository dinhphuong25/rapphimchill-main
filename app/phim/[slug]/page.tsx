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
import MovieRecommendations from "@/components/movie/movie-recommendations";

import TrailerButtonWithModal from "@/components/movie/trailer-modal";

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

  const thumbUrl = movie.thumb_url?.startsWith("http")
    ? movie.thumb_url
    : `https://phimimg.com/${movie.thumb_url}`;

  const totalEpisodes = episodes?.[0]?.server_data?.length || 0;

  return (
    <main className="min-h-screen bg-[#0a0c0e] text-cinema-text lg:pl-[200px] transition-all duration-300">
      <Sidebar categories={categories as any[]} countries={countries as any[]} />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 space-y-8">
        
        {/* Prominent Featured Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-brand-green/20 bg-gradient-to-br from-[#1b2029] via-[#13161c] to-[#0e1014] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(32,214,107,0.08)]">
          
          {/* Subtle glowing background aura */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-green/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Hero Card Content */}
          <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-10 items-center md:items-start">
            
            {/* Poster Image with Glowing Ring */}
            <div className="relative w-40 sm:w-52 md:w-64 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(32,214,107,0.2)] ring-2 ring-brand-green/40 group">
              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 160px, 280px"
                unoptimized={true}
              />
              {movie.quality && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-brand-green to-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(32,214,107,0.6)]">
                  {movie.quality}
                </span>
              )}
            </div>

            {/* Movie Info Details */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                {movie.name}
              </h1>

              {/* Subtitle */}
              {movie.origin_name && (
                <p className="text-white/60 text-sm sm:text-base font-medium mb-4">
                  {movie.origin_name}
                </p>
              )}

              {/* Meta Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4 text-[11px] sm:text-xs font-semibold">
                {movie.year && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-white/90 border border-white/15 backdrop-blur-md">
                    {movie.year}
                  </span>
                )}
                {movie.time && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-white/90 border border-white/15 backdrop-blur-md">
                    {movie.time}
                  </span>
                )}
                {totalEpisodes > 0 && (
                  <span className="px-3 py-1 bg-brand-green/20 text-brand-green border border-brand-green/40 rounded-full font-bold shadow-[0_0_10px_rgba(32,214,107,0.2)]">
                    {totalEpisodes} tập
                  </span>
                )}
                {movie.chieurap && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                    Chiếu rạp
                  </span>
                )}
              </div>

              {/* Category Chips */}
              {movie.category?.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-5">
                  {movie.category.map((cat: any) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/?category=${cat.slug || cat.id}`}
                      className="px-2.5 py-1 bg-white/[0.06] hover:bg-brand-green hover:text-black border border-white/10 hover:border-brand-green/50 text-white/80 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Synopsis Preview */}
              {movie.content && (
                <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6 line-clamp-4 max-w-2xl font-normal text-justify">
                  {movie.content
                    .replace(/<[^>]*>/g, "")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, "&")
                    .replace(/&#39;/g, "'")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&nbsp;/g, " ")}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3.5 w-full sm:w-auto mt-2">
                {episodes?.[0]?.server_data?.[0] && (
                  <Link
                    href={`/watch?slug=${slug}`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-brand-green hover:bg-[#1bc660] text-black font-extrabold text-base rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(32,214,107,0.4)] hover:shadow-[0_0_30px_rgba(32,214,107,0.6)]"
                  >
                    <Play className="w-5 h-5 fill-black text-black" />
                    <span className="text-black font-extrabold">Xem Phim Ngay</span>
                  </Link>
                )}
                
                {/* Interactive Trailer Modal Popup */}
                <TrailerButtonWithModal movieName={movie.name} trailerUrl={movie.trailer_url} />
              </div>

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
