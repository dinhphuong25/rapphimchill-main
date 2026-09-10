import PhimApi from "@/libs/phimapi.com";
import Description from "@/components/movie/description";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { notFound } from "next/navigation";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { LoadingWatch } from "@/components/ui/page-loaders";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { getCachedCategories, getCachedCountries } from "@/lib/data";

async function getMovieData(slug: string) {
  const api = new PhimApi();
  return api.get(slug);
}

export async function generateMetadata({ searchParams }: any) {
  const { slug } = await searchParams;
  if (!slug) return { title: "Xem phim" };
  
  try {
    const data = await getMovieData(slug);
    const movie = data?.movie;
    if (!movie?.name) return { title: "Xem phim" };
    const watchUrl = `https://hiphim.biz/watch?slug=${slug}`;
    const canonicalUrl = watchUrl;
    
    const posterUrl = movie.poster_url?.startsWith("http") 
      ? movie.poster_url 
      : `https://phimimg.com/${movie.poster_url}`;
      
    const thumbUrl = movie.thumb_url?.startsWith("http")
      ? movie.thumb_url
      : `https://phimimg.com/${movie.thumb_url}`;

    return {
      title: `${movie.name} - Xem phim HD chất lượng cao | Hi Phim`,
      description: movie.content
        ? movie.content.substring(0, 160) + "..."
        : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
      openGraph: {
        title: `${movie.name} - Xem phim HD chất lượng cao`,
        url: watchUrl,
        images: posterUrl ? [{ url: posterUrl, width: 300, height: 450 }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.name} - Xem phim HD`,
        images: [thumbUrl || posterUrl].filter(Boolean),
      },
      alternates: { canonical: canonicalUrl },
    };
  } catch {
    return { title: "Xem phim" };
  }
}

export default async function WatchPage({ searchParams }: any) {
  const { slug } = await searchParams;

  if (!slug || HIDDEN_MOVIE_SLUGS.includes(slug)) notFound();

  return (
    <Suspense fallback={<LoadingWatch />}>
      <WatchContent slug={slug} />
    </Suspense>
  );
}

async function WatchContent({ slug }: { slug: string }) {
  let movie: any, server: any;
  let categories: any[] = [];
  let countries: any[] = [];

  try {
    const [data, fetchedCategories, fetchedCountries] = await Promise.all([
      getMovieData(slug),
      getCachedCategories().catch(() => []),
      getCachedCountries().catch(() => []),
    ]);
    movie = data?.movie;
    server = data?.server;
    categories = fetchedCategories || [];
    countries = fetchedCountries || [];
  } catch {
    notFound();
  }

  if (!movie?.name) notFound();

  const breadcrumbItems = [
    { name: 'Trang chủ', url: '/' },
    { name: 'Xem phim', url: '/watch' },
    { name: movie.name, url: `/watch?slug=${slug}`, current: true }
  ];

  const structuredBreadcrumbItems = breadcrumbItems.map(item => ({
    name: item.name,
    url: `https://hiphim.biz${item.url}`
  }));

  const bgUrl = movie.poster_url?.startsWith("http") ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      {/* Dynamic Blurred Background - Chỉ hiện trên desktop để tối ưu GPU mobile */}
      <div 
        className="fixed inset-0 z-0 opacity-25 scale-105 pointer-events-none hidden sm:block will-change-transform"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px)',
          transform: 'translateZ(0)',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-cinema-bg/80 via-cinema-bg/95 to-cinema-bg pointer-events-none" />

      {/* Main Cinema Page Layout - Full-width Standalone Cinema View */}
      <main className="relative z-10 min-h-screen lg:min-h-0 lg:h-full flex flex-col w-full lg:overflow-hidden">
        <MovieStructuredData
          movie={movie}
          url={`https://hiphim.biz/watch?slug=${slug}`}
        />
        <BreadcrumbStructuredData items={structuredBreadcrumbItems} />

        {/* Main Watch Container */}
        <div className="flex-1 lg:min-h-0 w-full max-w-[1920px] mx-auto pb-16 lg:pb-3 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <Description movie={movie} serverData={server} slug={slug} thumb_url={movie.thumb_url} />
        </div>
      </main>
    </div>
  );
}
