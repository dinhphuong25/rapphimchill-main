import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phim yêu thích",
  description: "Danh sách phim bạn đã đánh dấu yêu thích trên Rạp Phim Chill.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: "https://rapphimchill.app/favorites",
  },
  openGraph: {
    title: "Phim yêu thích | Rạp Phim Chill",
    description: "Danh sách phim bạn đã đánh dấu yêu thích trên Rạp Phim Chill.",
    url: "https://rapphimchill.app/favorites",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim yêu thích | Rạp Phim Chill",
    description: "Danh sách phim bạn đã đánh dấu yêu thích trên Rạp Phim Chill.",
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
