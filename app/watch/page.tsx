// Cache the watch page at Vercel Edge for 10 minutes (eliminates massive Node.js Serverless CPU usage)
export const revalidate = 600;

import PhimApi from "@/libs/phimapi.com";
import Description from "@/components/movie/description";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { notFound } from "next/navigation";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { LoadingWatch } from "@/components/ui/page-loaders";
import { getCachedCategories, getCachedCountries } from "@/lib/data";
import { normalizeImageUrl } from "@/lib/image-helper";

const getMovieData = (slug: string) =>
  unstable_cache(
    async () => {
      const api = new PhimApi();
      return api.get(slug);
    },
    [`movie-data-${slug}`],
    { revalidate: 1800, tags: ["movies", `movie-${slug}`] }
  )();

export async function generateMetadata({ searchParams }: any) {
  const { slug } = await searchParams;
  if (!slug) return { title: "Xem phim" };
  
  try {
    const data = await getMovieData(slug);
    const movie = data?.movie;
    if (!movie?.name) return { title: "Xem phim" };
    const watchUrl = `https://hiphim.biz/watch?slug=${slug}`;
    const canonicalUrl = watchUrl;
    
    const posterUrl = normalizeImageUrl(movie.poster_url);
    const thumbUrl = normalizeImageUrl(movie.thumb_url);

    const ogParams = new URLSearchParams({
      title: movie.name || '',
      origin_name: movie.origin_name || '',
      year: String(movie.year || ''),
      quality: movie.quality || 'Full HD',
      ep: movie.episode_current || '',
      poster: thumbUrl || posterUrl || '',
    });
    const dynamicOgUrl = `https://hiphim.biz/api/og?${ogParams.toString()}`;

    return {
      title: `${movie.name} - Xem phim HD chất lượng cao | Hi Phim`,
      description: movie.content
        ? movie.content.substring(0, 160) + "..."
        : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
      openGraph: {
        title: `${movie.name} - Xem phim HD chất lượng cao`,
        description: movie.content
          ? movie.content.substring(0, 160) + "..."
          : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
        url: watchUrl,
        siteName: "Hi Phim",
        images: [
          {
            url: dynamicOgUrl,
            width: 1200,
            height: 630,
            alt: `${movie.name} - Hi Phim`,
          },
          ...(posterUrl ? [{ url: posterUrl, width: 300, height: 450, alt: movie.name }] : []),
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.name} - Xem phim HD`,
        description: movie.content
          ? movie.content.substring(0, 160) + "..."
          : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
        images: [dynamicOgUrl],
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

  const bgUrl = normalizeImageUrl(movie.poster_url || movie.thumb_url);
  const firstM3u8 = server?.[0]?.server_data?.[0]?.link_m3u8;
  let m3u8Origin = "";
  if (firstM3u8) {
    try {
      m3u8Origin = new URL(firstM3u8).origin;
    } catch {}
  }

  return (
    <div className="min-h-screen bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      {m3u8Origin && (
        <>
          <link rel="dns-prefetch" href={m3u8Origin} />
          <link rel="preconnect" href={m3u8Origin} crossOrigin="anonymous" />
        </>
      )}
      <link rel="dns-prefetch" href="https://player.phimapi.com" />
      <link rel="preconnect" href="https://player.phimapi.com" crossOrigin="anonymous" />
      {firstM3u8 && (
        <link rel="preload" href={firstM3u8} as="fetch" crossOrigin="anonymous" />
      )}
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
      <main className="relative z-10 min-h-0 sm:min-h-screen flex flex-col w-full">
        <MovieStructuredData
          movie={movie}
          url={`https://hiphim.biz/watch?slug=${slug}`}
        />
        <BreadcrumbStructuredData items={structuredBreadcrumbItems} />

        {/* Main Watch Container */}
        <div className="w-full max-w-[1920px] mx-auto pb-3 sm:pb-16 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <Description movie={movie} serverData={server} slug={slug} thumb_url={movie.thumb_url} />
        </div>
      </main>
    </div>
  );
}
