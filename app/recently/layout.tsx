import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phim đã xem gần đây",
  description: "Xem lại danh sách phim bạn đã xem gần đây trên Rạp Phim Chill.",
  alternates: {
    canonical: "https://rapphimchill.app/recently",
  },
  openGraph: {
    title: "Phim đã xem gần đây | Rạp Phim Chill",
    description: "Xem lại danh sách phim bạn đã xem gần đây trên Rạp Phim Chill.",
    url: "https://rapphimchill.app/recently",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim đã xem gần đây | Rạp Phim Chill",
    description: "Xem lại danh sách phim bạn đã xem gần đây trên Rạp Phim Chill.",
  },
};

export default function RecentlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
