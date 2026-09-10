import type { Metadata } from "next";
import RankingClient from "@/components/ranking/ranking-client";
import { getCachedAllRankings } from "@/lib/data";
import ScrollToTop from "@/components/ui/scroll-to-top";

export const revalidate = 900; // 15 minutes ISR cache

export const metadata: Metadata = {
  title: "Bảng Xếp Hạng Phim Hay | Top Phim Hot Nhất 2026 - Hi Phim",
  description:
    "Khám phá bảng xếp hạng phim hot nhất: Top phim ngày, Top phim tuần, Top phim tháng, Top lượt xem nhiều nhất và Top phim đánh giá cao nhất trên Hi Phim.",
  keywords: [
    "bảng xếp hạng phim",
    "top phim hay",
    "top phim ngày",
    "top phim tuần",
    "top phim tháng",
    "top lượt xem",
    "top đánh giá phim",
    "hi phim",
  ],
  openGraph: {
    title: "Bảng Xếp Hạng Phim Hay | Top Phim Hot Nhất 2026 - Hi Phim",
    description:
      "Bảng xếp hạng phim mới cập nhật liên tục: Top ngày, top tuần, top tháng, top view và top rating trên Hi Phim.",
    type: "website",
  },
};

export default async function RankingPage() {
  const rankingsData = await getCachedAllRankings();

  return (
    <>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-20">
        <RankingClient initialData={rankingsData} />
      </main>
      <ScrollToTop />
    </>
  );
}
