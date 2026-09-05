import PhimApi from "@/libs/phimapi.com";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MovieListClient from "@/components/movie/movie-list-client";
import Sidebar from "@/components/sidebar";
import ScrollToTop from "@/components/ui/scroll-to-top";

type NewUpdatesProps = {
  searchParams: Promise<{
    index?: string;
  }>;
};

export async function generateMetadata({ searchParams }: NewUpdatesProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;

  return {
    title: `Mới Cập Nhật | Hi Phim${index > 1 ? " - Trang " + index : ""}`,
    description: "Khám phá những bộ phim mới nhất được cập nhật trên Hi Phim.",
    keywords: "phim mới, phim cập nhật, phim ảnh, phim hd, hi phim, hiphim",
  };
}

export default async function NewUpdatesPage({ searchParams }: NewUpdatesProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;

  const api = new PhimApi();
  const topics = api.listTopics();
  const categories = await api.listCategories();
  const countries = await api.listCountries();

  return (
    <main className="min-h-screen bg-cinema-bg text-cinema-text lg:pl-[200px] transition-all duration-300">
      <Sidebar categories={categories as any[]} countries={countries as any[]} />
      <Header
        categories={categories}
        countries={countries}
        topics={topics}
      />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-20">
        <MovieListClient index={index} />
      </div>
      <Footer />
      <ScrollToTop />
    </main>
  );
}