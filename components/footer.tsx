"use client";

export default function Footer() {
  return (
    <footer className="w-full pt-6 pb-28 md:pb-6 border-t border-white/5">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-xs text-gray-400">
          Được quản lý và phát triển bởi{" "}
          <a
            href="https://www.facebook.com/dinhphuongkim.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
          >
            Kim Đình Phương
          </a>
        </p>
        <p className="text-xs text-gray-500">
          © 2025 Rạp Phim Chill. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
