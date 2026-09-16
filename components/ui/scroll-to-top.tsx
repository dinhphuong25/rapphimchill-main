"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkPosition = () => {
      const isScrolled = window.scrollY > 400;
      setVisible(isScrolled);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkPosition);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      className={cn(
        "fixed right-5 sm:right-6 bottom-20 lg:bottom-10 z-40 p-3 rounded-full",
        "bg-primary text-black font-bold shadow-lg shadow-primary/20 transform-gpu",
        "hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

export { ScrollToTop as ScrollToTopFAB };
