import PhimApi from "@/libs/phimapi.com";
import Description from "@/components/movie/description";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { notFound } from "next/navigation";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { LoadingWatch } from "@/components/ui/page-loaders";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { getCachedCategories, getCachedCountries } from "@/lib/data";

const getMovieData = unstable_cache(
  async (slug: string) => {
    const api = new PhimApi();
    return api.get(slug);
  },
  ["watch-movie-data"],
  { revalidate: 3600 }
);

export async function generateMetadata({ searchParams }: any) {
  const { slug } = await searchParams;
  if (!slug) return { title: "Xem phim" };
  
  try {
    const data = await getMovieData(slug);
    const movie = data?.movie;
    if (!movie?.name) return { title: "Xem phim" };
    const watchUrl = `https://rapphimchill.app/watch?slug=${slug}`;
    const canonicalUrl = `https://rapphimchill.app/phim/${slug}`;
    
    const posterUrl = movie.poster_url?.startsWith("http") 
      ? movie.poster_url 
      : `https://phimimg.com/${movie.poster_url}`;
      
    const thumbUrl = movie.thumb_url?.startsWith("http")
      ? movie.thumb_url
      : `https://phimimg.com/${movie.thumb_url}`;

    return {
      title: `${movie.name} - Xem phim HD chất lượng cao | Rạp Phim Chill`,
      description: movie.content
        ? movie.content.substring(0, 160) + "..."
        : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Rạp Phim Chill.`,
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
    url: `https://rapphimchill.app${item.url}`
  }));

  const bgUrl = movie.poster_url?.startsWith("http") ? movie.poster_url : `https://phimimg.com/${movie.poster_url}`;

  return (
    <div className="min-h-screen bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      {/* Dynamic Blurred Background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-cinema-bg/80 via-cinema-bg/95 to-cinema-bg pointer-events-none" />

      {/* Main Cinema Page Layout - Full-width Standalone Cinema View */}
      <main className="relative z-10 min-h-screen flex flex-col w-full">
        <MovieStructuredData
          movie={movie}
          url={`https://rapphimchill.app/watch?slug=${slug}`}
        />
        <BreadcrumbStructuredData items={structuredBreadcrumbItems} />

        {/* Main Watch Container */}
        <div className="flex-1 w-full max-w-[1920px] mx-auto pb-16 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <Description movie={movie} serverData={server} slug={slug} thumb_url={movie.thumb_url} />
        </div>

        <Footer />
      </main>
    </div>
  );
}
