import { getCachedCategories, getCachedCountries } from "@/lib/data";
import RecentlyWatchedClient from "./recently-client";

export const metadata = {
  title: "Lịch Sử Xem | Hi Phim",
  description: "Phim bạn đã xem gần đây",
};

export default async function RecentlyWatchedPage() {
  const [categories, countries] = await Promise.all([
    getCachedCategories(),
    getCachedCountries(),
  ]);

  return <RecentlyWatchedClient categories={categories as any[]} countries={countries as any[]} />;
}