"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState<number | null>(null);

  useEffect(() => {
    let ticking = false;
    let footerEl: HTMLElement | null = null;

    const checkPosition = () => {
      const isScrolled = window.scrollY > 300;
      setVisible(isScrolled);

      if (isScrolled) {
        if (!footerEl) {
          footerEl = document.querySelector("footer");
        }
        if (footerEl) {
          const footerRect = footerEl.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          if (footerRect.top < windowHeight) {
            const overlap = windowHeight - footerRect.top;
            setBottomOffset(overlap + 16);
          } else {
            setBottomOffset(null);
          }
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkPosition);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
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
      style={bottomOffset !== null ? { bottom: `${bottomOffset}px` } : undefined}
      className={cn(
        "fixed right-5 sm:right-6 z-40 p-3 rounded-full",
        bottomOffset === null ? "bottom-20 lg:bottom-10" : "",
        "bg-primary text-black font-bold shadow-lg shadow-primary/20 transform-gpu",
        "hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

export { ScrollToTop as ScrollToTopFAB };
