import { getCachedCategories, getCachedCountries } from "@/lib/data";
import FavoritesClient from "./favorites-client";

export const metadata = {
  title: "Phim Yêu Thích | Rạp Phim Chill",
  description: "Danh sách phim yêu thích của bạn",
};

export default async function FavoritesPage() {
  const [categories, countries] = await Promise.all([
    getCachedCategories(),
    getCachedCountries(),
  ]);

  return <FavoritesClient categories={categories as any[]} countries={countries as any[]} />;
}
